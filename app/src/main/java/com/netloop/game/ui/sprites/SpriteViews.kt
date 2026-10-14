package com.netloop.game.ui.sprites

import androidx.compose.foundation.Image
import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.runtime.produceState
import androidx.compose.runtime.withFrameMillis
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.geometry.isSpecified
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.res.painterResource

@Composable
fun rememberClockMs(): State<Long> = produceState(0L) {
    val start = withFrameMillis { it }
    while (true) {
        value = withFrameMillis { it } - start
    }
}

@Composable
fun Sprite(anim: SpriteAnim, clockMs: Long, modifier: Modifier = Modifier, contentDescription: String? = null) {
    Image(
        painter = painterResource(anim.frameAt(clockMs)),
        contentDescription = contentDescription,
        modifier = modifier,
    )
}

@Composable
fun AnimatedSprite(anim: SpriteAnim, modifier: Modifier = Modifier, contentDescription: String? = null) {
    val clock = rememberClockMs()
    Sprite(anim, clock.value, modifier, contentDescription)
}

class SpritePainters(private val painters: Map<Int, Painter>) {
    operator fun get(id: Int): Painter = painters.getValue(id)
}

@Composable
fun rememberSpritePainters(anims: List<SpriteAnim>): SpritePainters {
    val ids = anims.flatMap { it.frames }.distinct()
    return SpritePainters(ids.associateWith { painterResource(it) })
}

fun DrawScope.drawSprite(painter: Painter, center: Offset, widthPx: Float, alpha: Float = 1f) {
    val intrinsic = painter.intrinsicSize
    val ratio = if (intrinsic.isSpecified && intrinsic.width > 0f) intrinsic.height / intrinsic.width else 1f
    val size = Size(widthPx, widthPx * ratio)
    translate(center.x - size.width / 2f, center.y - size.height / 2f) {
        with(painter) { draw(size, alpha) }
    }
}
