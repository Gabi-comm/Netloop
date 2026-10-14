package com.netloop.game.ui.screens

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.TextMeasurer
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.sp
import com.netloop.game.game.GameEngine
import com.netloop.game.ui.sprites.SpritePainters
import com.netloop.game.ui.sprites.SpriteSheet
import com.netloop.game.ui.sprites.drawSprite
import com.netloop.game.ui.theme.NetColors

private val doodles = listOf(0.08f to 0.62f, 0.87f to 0.47f, 0.51f to 0.30f, 0.15f to 0.90f, 0.9f to 0.95f)

fun DrawScope.drawPlayfield(engine: GameEngine, painters: SpritePainters, text: TextMeasurer, displayFont: FontFamily) {
    val dp = density
    val now = engine.clockMs

    doodles.forEach { (x, y) ->
        drawSprite(painters[SpriteSheet.envGrass.frameAt(0)], Offset(size.width * x, size.height * y), 18f * dp)
    }

    engine.cables.forEach { cable ->
        val path = Path()
        cable.points.forEachIndexed { i, p -> if (i == 0) path.moveTo(p.x, p.y) else path.lineTo(p.x, p.y) }
        drawPath(path, NetColors.Cable, style = Stroke(width = 5f * dp, cap = StrokeCap.Round, join = StrokeJoin.Round))
    }

    val server = engine.serverPosition
    drawSprite(painters[SpriteSheet.envCloud.frameAt(0)], Offset(server.x, size.height - 30f * dp), size.width * 0.78f)
    val serverAnim = when {
        now - engine.serverHurtAtMs < SpriteSheet.serverHurt.durationMs -> SpriteSheet.serverHurt
        engine.threatsNearServer -> SpriteSheet.serverAlert
        else -> SpriteSheet.serverIdle
    }
    val serverFrame = if (serverAnim == SpriteSheet.serverHurt) now - engine.serverHurtAtMs else now
    drawSprite(painters[serverAnim.frameAt(serverFrame)], server, 86f * dp)

    val frozen = engine.isFrozen
    engine.packets.forEach { p ->
        val flash = now - p.lastHitMs < 160
        val alpha = if (frozen && p.kind.isThreat) 0.55f else if (flash) 0.6f else 1f
        val anim = p.anim
        val frameClock = if (frozen && p.kind.isThreat) 0L else now - p.bornMs
        drawSprite(painters[anim.frameAt(frameClock)], p.position, p.kind.sizeDp * dp, alpha)
    }

    if (engine.line.size > 1) {
        val path = Path()
        engine.line.forEachIndexed { i, p -> if (i == 0) path.moveTo(p.x, p.y) else path.lineTo(p.x, p.y) }
        drawPath(path, NetColors.Chalk, style = Stroke(width = 6f * dp, cap = StrokeCap.Round, join = StrokeJoin.Round))
        drawSprite(painters[SpriteSheet.fxSnapRing.frameAt(now)], engine.line.first(), engine.snapRadius * 2.2f)
        drawBandwidthRing(engine.line.last(), engine.bandwidth)
    }

    engine.effects.forEach { e ->
        drawSprite(painters[e.anim.frameAt(now - e.startMs)], e.at, e.widthPx)
    }

    engine.popups.forEach { pop ->
        val age = (now - pop.startMs) / 900f
        val layout = text.measure(pop.text, TextStyle(color = pop.color, fontSize = 26.sp, fontFamily = displayFont))
        val at = pop.at + Offset(-layout.size.width / 2f, -40f * dp - age * 30f * dp)
        drawText(layout, topLeft = at, alpha = (1f - age).coerceIn(0f, 1f))
    }
}

private fun DrawScope.drawBandwidthRing(center: Offset, bandwidth: Float) {
    val dp = density
    val r = 27f * dp
    val stroke = Stroke(width = 6f * dp, cap = StrokeCap.Round)
    val topLeft = Offset(center.x - r, center.y - r)
    val box = Size(r * 2, r * 2)
    drawArc(NetColors.Cable, 0f, 360f, false, topLeft, box, style = stroke)
    drawArc(NetColors.Data, -90f, 360f * bandwidth, false, topLeft, box, style = stroke)
    drawCircle(NetColors.Chalk, 12f * dp, center)
}
