package com.netloop.game.game

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import com.netloop.game.ui.sprites.SpriteAnim
import com.netloop.game.ui.sprites.SpriteSheet
import com.netloop.game.ui.theme.NetColors
import kotlin.math.max
import kotlin.math.min

enum class FightPhase { PLAYING, PAUSED, CLEARED, LOST }

class Effect(val anim: SpriteAnim, val at: Offset, val startMs: Long, val widthPx: Float)

class Popup(val text: String, val at: Offset, val startMs: Long, val color: Color)

class GameEngine(val run: RunState, private val density: Float) {
    var frame by mutableLongStateOf(0L)
        private set
    var phase by mutableStateOf(FightPhase.PLAYING)
        private set
    var score by mutableIntStateOf(run.score)
        private set
    var combo by mutableIntStateOf(1)
        private set
    var uptime by mutableIntStateOf(run.uptime)
        private set
    var bandwidth by mutableFloatStateOf(1f)
        private set
    var killSwitchUsed by mutableStateOf(run.killSwitchUsed)
        private set
    var honeypotReady by mutableStateOf(run.has(Patch.HONEYPOT))
        private set

    var clockMs = 0L
        private set
    var serverHurtAtMs = Long.MIN_VALUE / 2
        private set
    var width = 0f
        private set
    var height = 0f
        private set
    var cables: List<Cable> = emptyList()
        private set
    var drawing = false
        private set

    val packets = mutableListOf<Packet>()
    val effects = mutableListOf<Effect>()
    val popups = mutableListOf<Popup>()
    val line = mutableListOf<Offset>()

    private val spawns = ArrayDeque(WavePlan.build(run.wave, NetworkLayout.cableCount, run.random))
    private var nextId = 0
    private var vpnCharge = run.has(Patch.VPN_TUNNEL)
    private var freezeUntilMs = 0L
    private var honeypotReadyAtMs = 0L

    val snapRadius: Float get() = 30f * density
    val isFrozen: Boolean get() = clockMs < freezeUntilMs
    val serverPosition: Offset get() = Offset(width * NetworkLayout.server.x, height * NetworkLayout.server.y)
    val threatsNearServer: Boolean get() = packets.any { it.kind.isThreat && it.progress > 0.75f }
    private val inkMax: Float get() = width * 1.8f * (if (run.has(Patch.BROADCAST)) 1.25f else 1f)

    fun setSize(w: Float, h: Float) {
        if (w == width && h == height) return
        width = w
        height = h
        cables = NetworkLayout.build(w, h)
        packets.forEach { it.position = cables[it.cable].pointAt(it.progress) }
    }

    fun pause() {
        if (phase == FightPhase.PLAYING) {
            phase = FightPhase.PAUSED
            cancelLine()
        }
    }

    fun resume() {
        if (phase == FightPhase.PAUSED) phase = FightPhase.PLAYING
    }

    fun update(dtMs: Long) {
        if (phase != FightPhase.PLAYING || width == 0f) return
        clockMs += dtMs
        val dt = dtMs / 1000f

        while (spawns.isNotEmpty() && spawns.first().atMs <= clockMs) spawn(spawns.removeFirst())

        val slow = if (drawing && run.has(Patch.RATE_LIMITER)) 0.6f else 1f
        val frozen = isFrozen
        val iterator = packets.iterator()
        while (iterator.hasNext()) {
            val p = iterator.next()
            val cable = cables[p.cable]
            if (!(frozen && p.kind.isThreat)) p.progress += p.kind.speed * slow * dt * height / cable.length
            p.position = cable.pointAt(p.progress)
            if (p.progress >= 1f) {
                iterator.remove()
                reachServer(p)
                continue
            }
            if (p.kind == PacketKind.ZERO_DAY && drawing && line.size > 1 &&
                clockMs - p.lastHitMs > 1_000 &&
                Geometry.minDistance(p.position, line) < 22f * density
            ) {
                zeroDayHit(p)
            }
        }

        if (!drawing) bandwidth = min(1f, bandwidth + 0.35f * dt)
        honeypotReady = run.has(Patch.HONEYPOT) && clockMs >= honeypotReadyAtMs
        effects.removeAll { clockMs - it.startMs > it.anim.durationMs }
        popups.removeAll { clockMs - it.startMs > 900 }

        if (phase == FightPhase.PLAYING && spawns.isEmpty() && packets.none { it.kind.isThreat }) finishWave()
        frame++
    }

    fun startLine(at: Offset) {
        if (phase != FightPhase.PLAYING || bandwidth < 0.05f) return
        line.clear()
        line += at
        drawing = true
    }

    fun extendLine(at: Offset) {
        if (!drawing) return
        val step = (at - line.last()).getDistance()
        if (step < 4f * density) return
        bandwidth -= step / inkMax
        if (bandwidth <= 0f) {
            bandwidth = 0f
            breakLine(at)
            return
        }
        line += at
        if (line.size > 8 && Geometry.length(line) > width * 0.35f && (at - line.first()).getDistance() < snapRadius) {
            closeLoop()
        }
    }

    fun endLine() {
        if (!drawing) return
        if (line.size > 8 && (line.last() - line.first()).getDistance() < snapRadius * 1.6f) closeLoop() else cancelLine()
    }

    fun useKillSwitch() {
        if (!run.has(Patch.KILL_SWITCH) || killSwitchUsed || phase != FightPhase.PLAYING) return
        killSwitchUsed = true
        run.killSwitchUsed = true
        val dropped = packets.filter { it.kind.isThreat }
        dropped.forEach { drop(it, multiplier = 1) }
        packets.removeAll(dropped.toSet())
    }

    fun useHoneypot() {
        if (!honeypotReady || phase != FightPhase.PLAYING) return
        freezeUntilMs = clockMs + 3_000
        honeypotReadyAtMs = clockMs + 20_000
        honeypotReady = false
    }

    private fun spawn(s: Spawn) {
        val p = Packet(nextId++, s.kind, s.cable, 0f, clockMs)
        if (cables.isNotEmpty()) p.position = cables[s.cable].pointAt(0f)
        packets += p
    }

    private fun reachServer(p: Packet) {
        if (p.kind.isThreat) {
            uptime -= 1
            combo = 1
            serverHurtAtMs = clockMs
            if (uptime <= 0) {
                uptime = 0
                phase = FightPhase.LOST
                cancelLine()
                commitToRun()
            }
        } else {
            score += p.kind.points
            run.dataEarned += 1
            popups += Popup("+${p.kind.points}", serverPosition, clockMs, NetColors.Legit)
        }
    }

    private fun zeroDayHit(p: Packet) {
        p.lastHitMs = clockMs
        popups +=Popup("zero-day!", p.position, clockMs, NetColors.Pink)
        if (vpnCharge) {
            vpnCharge = false
            popups += Popup("VPN held", line.last(), clockMs, NetColors.Rare)
        } else {
            breakLine(p.position)
        }
    }

    private fun closeLoop() {
        val loop = line.toList()
        drawing = false
        line.clear()
        effects += Effect(SpriteSheet.fxPop, loop.first(), clockMs, 70f * density)

        var dropped = 0
        var hitLegit = false
        val born = mutableListOf<Packet>()
        val removed = mutableListOf<Packet>()
        for (p in packets) {
            if (!Geometry.pointInPolygon(p.position, loop)) continue
            if (!p.kind.isThreat) {
                hitLegit = true
                continue
            }
            p.hp -= 1
            p.lastHitMs = clockMs
            if (p.hp > 0) continue
            dropped++
            drop(p, combo)
            removed += p
            if (p.kind == PacketKind.WORM) born += splitWorm(p)
        }
        packets.removeAll(removed.toSet())
        packets += born

        if (hitLegit) {
            combo = 1
            score = max(0, score - 50)
            popups += Popup("-50 legit!", Geometry.centroid(loop), clockMs, NetColors.Threat)
        } else if (dropped > 0) {
            combo = min(combo + 1, 5)
        }
    }

    private fun drop(p: Packet, multiplier: Int) {
        val gain = p.kind.points * multiplier
        score += gain
        effects += Effect(SpriteSheet.malwarePop, p.position, clockMs, p.kind.sizeDp * density * 1.4f)
        popups += Popup("+$gain", p.position, clockMs, NetColors.Points)
    }

    private fun splitWorm(p: Packet): List<Packet> = listOf(-0.04f, 0.02f).map { delta ->
        Packet(nextId++, PacketKind.WORM_MINI, p.cable, (p.progress + delta).coerceIn(0f, 0.98f), clockMs).also {
            it.position = cables[p.cable].pointAt(it.progress)
        }
    }

    private fun breakLine(at: Offset) {
        effects += Effect(SpriteSheet.fxLineBreak, at, clockMs, 60f * density)
        combo = 1
        cancelLine()
    }

    private fun cancelLine() {
        drawing = false
        line.clear()
    }

    private fun finishWave() {
        phase = FightPhase.CLEARED
        cancelLine()
        if (run.has(Patch.AUTO_PATCH)) uptime = min(run.maxUptime, uptime + 1)
        commitToRun()
    }

    private fun commitToRun() {
        run.score = score
        run.uptime = uptime
        run.killSwitchUsed = killSwitchUsed
    }
}
