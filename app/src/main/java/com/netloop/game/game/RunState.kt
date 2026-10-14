package com.netloop.game.game

import java.time.LocalDate
import kotlin.random.Random

class RunState(val seed: Long, val isDaily: Boolean) {
    val random = Random(seed)
    val maxWaves = 10
    val maxUptime = 3
    var wave = 1
    var score = 0
    var dataEarned = 0
    var uptime = maxUptime
    var killSwitchUsed = false
    val patches = mutableListOf<Patch>()

    fun has(patch: Patch): Boolean = patch in patches

    val isFinalWave: Boolean get() = wave >= maxWaves

    companion object {
        fun random(): RunState = RunState(System.nanoTime(), isDaily = false)
        fun daily(date: LocalDate = LocalDate.now()): RunState = RunState(date.toEpochDay(), isDaily = true)
    }
}
