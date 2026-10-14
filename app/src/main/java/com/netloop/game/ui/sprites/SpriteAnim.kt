package com.netloop.game.ui.sprites

import androidx.annotation.DrawableRes

data class SpriteAnim(
    val name: String,
    val frames: List<Int>,
    val frameMs: Int,
    val loop: Boolean,
    val width: Int,
    val height: Int,
) {
    val durationMs: Long get() = frameMs.toLong() * frames.size

    @DrawableRes
    fun frameAt(elapsedMs: Long): Int {
        val index = (elapsedMs.coerceAtLeast(0) / frameMs).toInt()
        return if (loop) frames[index % frames.size] else frames[index.coerceAtMost(frames.lastIndex)]
    }
}
