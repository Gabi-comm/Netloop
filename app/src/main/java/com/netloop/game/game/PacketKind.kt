package com.netloop.game.game

import androidx.compose.ui.geometry.Offset
import com.netloop.game.ui.sprites.SpriteAnim
import com.netloop.game.ui.sprites.SpriteSheet

enum class PacketKind(
    val label: String,
    val isThreat: Boolean,
    val hp: Int,
    val speed: Float,
    val points: Int,
    val sizeDp: Float,
    val firstWave: Int,
    val walk: SpriteAnim,
) {
    LEGIT("Legit Packet", false, 1, 0.075f, 10, 40f, 1, SpriteSheet.legitWalk),
    MALWARE("Malware", true, 1, 0.07f, 100, 42f, 1, SpriteSheet.malwareWalk),
    PING_FLOOD("Ping Flood", true, 1, 0.1f, 30, 30f, 2, SpriteSheet.pingFloodSwarm),
    ZERO_DAY("Zero-Day", true, 1, 0.12f, 200, 40f, 3, SpriteSheet.zeroDaySpin),
    WORM("Worm", true, 1, 0.06f, 120, 46f, 4, SpriteSheet.wormCrawl),
    WORM_MINI("Worm (half)", true, 1, 0.08f, 60, 32f, Int.MAX_VALUE, SpriteSheet.wormMiniCrawl),
    RANSOMWARE("Ransomware", true, 2, 0.05f, 250, 46f, 5, SpriteSheet.ransomwareWalk),
    SPOOFER("Spoofer", true, 1, 0.07f, 150, 42f, 6, SpriteSheet.spooferWalk),
    TROJAN("Trojan", true, 1, 0.055f, 180, 46f, 7, SpriteSheet.trojanIdle),
    MAN_IN_THE_MIDDLE("Man in the Middle", true, 1, 0.07f, 160, 42f, 8, SpriteSheet.mitmWalk),
    BOTNET_NODE("Botnet Node", true, 3, 0.04f, 300, 56f, 9, SpriteSheet.botnetOrbit),
}

class Packet(val id: Int, val kind: PacketKind, val cable: Int, var progress: Float, val bornMs: Long) {
    var hp: Int = kind.hp
    var position: Offset = Offset.Zero
    var lastHitMs: Long = Long.MIN_VALUE / 2

    val anim: SpriteAnim
        get() = if (kind == PacketKind.RANSOMWARE && hp < kind.hp) SpriteSheet.ransomwareCracked else kind.walk
}
