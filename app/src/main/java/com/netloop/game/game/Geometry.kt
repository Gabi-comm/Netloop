package com.netloop.game.game

import androidx.compose.ui.geometry.Offset

object Geometry {
    fun pointInPolygon(point: Offset, polygon: List<Offset>): Boolean {
        if (polygon.size < 3) return false
        var inside = false
        var j = polygon.lastIndex
        for (i in polygon.indices) {
            val a = polygon[i]
            val b = polygon[j]
            if ((a.y > point.y) != (b.y > point.y) &&
                point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x
            ) {
                inside = !inside
            }
            j = i
        }
        return inside
    }

    fun length(points: List<Offset>): Float {
        var total = 0f
        for (i in 1 until points.size) total += (points[i] - points[i - 1]).getDistance()
        return total
    }

    fun minDistance(point: Offset, points: List<Offset>): Float =
        points.minOfOrNull { (it - point).getDistance() } ?: Float.MAX_VALUE

    fun centroid(points: List<Offset>): Offset {
        if (points.isEmpty()) return Offset.Zero
        var x = 0f
        var y = 0f
        points.forEach { x += it.x; y += it.y }
        return Offset(x / points.size, y / points.size)
    }

    fun quadratic(a: Offset, control: Offset, b: Offset, t: Float): Offset {
        val u = 1f - t
        return a * (u * u) + control * (2f * u * t) + b * (t * t)
    }
}
