package com.netloop.game.game

import androidx.compose.ui.geometry.Offset

class Cable(val points: List<Offset>) {
    private val cumulative = FloatArray(points.size)
    val length: Float

    init {
        for (i in 1 until points.size) cumulative[i] = cumulative[i - 1] + (points[i] - points[i - 1]).getDistance()
        length = cumulative.last()
    }

    fun pointAt(t: Float): Offset {
        val target = t.coerceIn(0f, 1f) * length
        var i = 1
        while (i < points.lastIndex && cumulative[i] < target) i++
        val segment = cumulative[i] - cumulative[i - 1]
        val local = if (segment > 0f) (target - cumulative[i - 1]) / segment else 0f
        return points[i - 1] + (points[i] - points[i - 1]) * local
    }
}

object NetworkLayout {
    val server = Offset(0.5f, 0.86f)

    private val routes = listOf(
        Offset(-0.06f, 0.30f) to Offset(0.30f, 0.42f),
        Offset(1.06f, 0.34f) to Offset(0.70f, 0.50f),
        Offset(0.30f, 0.26f) to Offset(0.40f, 0.55f),
        Offset(1.06f, 0.70f) to Offset(0.80f, 0.74f),
        Offset(-0.06f, 0.66f) to Offset(0.20f, 0.76f),
    )

    val cableCount: Int get() = routes.size

    fun build(width: Float, height: Float, samples: Int = 40): List<Cable> = routes.map { (start, control) ->
        val a = Offset(start.x * width, start.y * height)
        val c = Offset(control.x * width, control.y * height)
        val b = Offset(server.x * width, server.y * height)
        Cable((0..samples).map { Geometry.quadratic(a, c, b, it / samples.toFloat()) })
    }
}
