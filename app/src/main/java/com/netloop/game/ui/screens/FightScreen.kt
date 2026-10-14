package com.netloop.game.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.runtime.withFrameMillis
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.netloop.game.game.FightPhase
import com.netloop.game.game.GameEngine
import com.netloop.game.game.Patch
import com.netloop.game.game.RunState
import com.netloop.game.ui.components.AbilityButton
import com.netloop.game.ui.components.ChunkyButton
import com.netloop.game.ui.components.NetText
import com.netloop.game.ui.components.SquareIconButton
import com.netloop.game.ui.components.UptimeBars
import com.netloop.game.ui.components.WaveDots
import com.netloop.game.ui.sprites.SpriteSheet
import com.netloop.game.ui.sprites.rememberSpritePainters
import com.netloop.game.ui.theme.NetColors
import com.netloop.game.ui.theme.NetType
import kotlinx.coroutines.delay

@Composable
fun FightScreen(run: RunState, onWaveCleared: () -> Unit, onRunOver: () -> Unit, onQuit: () -> Unit) {
    val density = LocalDensity.current.density
    val engine = remember(run, run.wave) { GameEngine(run, density) }
    val painters = rememberSpritePainters(SpriteSheet.all)
    val textMeasurer = rememberTextMeasurer()
    val displayFont = NetType.display

    LaunchedEffect(engine) {
        var last = withFrameMillis { it }
        while (true) {
            withFrameMillis { now ->
                engine.update((now - last).coerceAtMost(50))
                last = now
            }
        }
    }

    LaunchedEffect(engine.phase) {
        if (engine.phase == FightPhase.CLEARED) {
            delay(1_000)
            onWaveCleared()
        }
    }

    BackHandler(enabled = engine.phase == FightPhase.PLAYING) { engine.pause() }

    Box(Modifier.fillMaxSize().background(NetColors.Ground)) {
        Canvas(
            Modifier
                .fillMaxSize()
                .onSizeChanged { engine.setSize(it.width.toFloat(), it.height.toFloat()) }
                .pointerInput(engine) {
                    detectDragGestures(
                        onDragStart = { engine.startLine(it) },
                        onDragEnd = { engine.endLine() },
                        onDragCancel = { engine.endLine() },
                        onDrag = { change, _ ->
                            change.consume()
                            engine.extendLine(change.position)
                        },
                    )
                },
        ) {
            engine.frame
            drawPlayfield(engine, painters, textMeasurer, displayFont)
        }

        FightHud(engine, Modifier.statusBarsPadding().padding(horizontal = 20.dp, vertical = 24.dp))

        Row(
            Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 18.dp, vertical = 22.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            val hasHoneypot = run.has(Patch.HONEYPOT)
            AbilityButton(
                icon = SpriteSheet.patchHoneypot,
                label = if (hasHoneypot) "honeypot" else "honeypot · locked",
                ready = engine.honeypotReady,
                accent = NetColors.EpicLight,
                onClick = engine::useHoneypot,
            )
            val hasKill = run.has(Patch.KILL_SWITCH)
            AbilityButton(
                icon = if (engine.killSwitchUsed || !hasKill) SpriteSheet.patchKillSwitchUsed else SpriteSheet.patchKillSwitch,
                label = when {
                    !hasKill -> "kill switch · locked"
                    engine.killSwitchUsed -> "kill switch · used"
                    else -> "kill switch"
                },
                ready = hasKill && !engine.killSwitchUsed,
                accent = NetColors.Threat,
                onClick = engine::useKillSwitch,
            )
        }

        when (engine.phase) {
            FightPhase.PAUSED -> Overlay("PAUSED", "the packets will wait.") {
                ChunkyButton("RESUME", engine::resume, height = 64.dp, fontSize = 36.sp)
                ChunkyButton("QUIT RUN", onQuit, height = 56.dp, fontSize = 28.sp, color = NetColors.Surface, shadow = NetColors.Line)
            }
            FightPhase.LOST -> Overlay("NETWORK DOWN", "score ${"%,d".format(engine.score)} · wave ${run.wave}") {
                ChunkyButton("BACK HOME", onRunOver, height = 64.dp, fontSize = 36.sp)
            }
            FightPhase.CLEARED -> Box(Modifier.align(Alignment.Center)) {
                NetText("WAVE CLEAR!", 64.sp, color = NetColors.Pink, display = true, letterSpacing = 3.sp)
            }
            FightPhase.PLAYING -> Unit
        }
    }
}

@Composable
private fun FightHud(engine: GameEngine, modifier: Modifier = Modifier) {
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row {
                    NetText("WAVE ${engine.run.wave}", 26.sp, display = true, letterSpacing = 1.sp)
                    NetText(" / ${engine.run.maxWaves}", 26.sp, color = NetColors.Muted, display = true)
                }
                WaveDots(engine.run.wave, engine.run.maxWaves)
            }
            SquareIconButton(SpriteSheet.uiPause, "Pause", engine::pause)
        }
        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
            NetText("%,d".format(engine.score), 58.sp, display = true, lineHeight = 58.sp)
            NetText("score", 18.sp, color = NetColors.Muted, letterSpacing = 2.sp)
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            UptimeBars(engine.uptime, engine.run.maxUptime)
            if (engine.combo > 1) {
                Box(
                    Modifier
                        .clip(CircleShape)
                        .background(NetColors.Points)
                        .padding(horizontal = 14.dp, vertical = 4.dp),
                ) {
                    NetText("x${engine.combo} combo", 26.sp, color = NetColors.Ground, display = true)
                }
            }
        }
    }
}

@Composable
private fun Overlay(title: String, subtitle: String, actions: @Composable () -> Unit) {
    Box(
        Modifier.fillMaxSize().background(Color(0xCC121212)),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            Modifier.padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            NetText(title, 56.sp, color = NetColors.Pink, display = true, letterSpacing = 3.sp)
            NetText(subtitle, 22.sp, color = NetColors.Soft)
            actions()
        }
    }
}
