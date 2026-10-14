package com.netloop.game.game

import androidx.compose.ui.graphics.Color
import com.netloop.game.ui.sprites.SpriteAnim
import com.netloop.game.ui.sprites.SpriteSheet
import com.netloop.game.ui.theme.NetColors
import kotlin.random.Random

enum class Rarity(val label: String, val color: Color) {
    COMMON("COMMON", NetColors.Soft),
    RARE("RARE", NetColors.Rare),
    EPIC("EPIC", NetColors.EpicLight),
}

enum class Patch(
    val title: String,
    val rarity: Rarity,
    val isActive: Boolean,
    val description: String,
    val icon: SpriteAnim,
) {
    RATE_LIMITER("Rate Limiter", Rarity.COMMON, false, "packets move 40% slower while you draw", SpriteSheet.patchRateLimiter),
    BROADCAST("Broadcast", Rarity.COMMON, false, "+25% bandwidth for longer lines", SpriteSheet.patchBroadcast),
    AUTO_PATCH("Auto-Patch", Rarity.RARE, false, "regain 1 uptime after every wave", SpriteSheet.patchAutoPatch),
    VPN_TUNNEL("VPN Tunnel", Rarity.RARE, false, "first zero-day hit each wave won't break your line", SpriteSheet.patchVpnTunnel),
    HONEYPOT("Honeypot", Rarity.RARE, true, "tap to freeze every threat for 3 seconds", SpriteSheet.patchHoneypot),
    KILL_SWITCH("Kill Switch", Rarity.EPIC, true, "tap once per run to drop every threat on screen", SpriteSheet.patchKillSwitch);

    val tag: String get() = if (isActive) "${rarity.label} · ACTIVE" else rarity.label

    companion object {
        fun offer(owned: Collection<Patch>, random: Random, count: Int = 3): List<Patch> =
            entries.filterNot { it in owned }.shuffled(random).take(count).sortedBy { it.rarity }
    }
}
