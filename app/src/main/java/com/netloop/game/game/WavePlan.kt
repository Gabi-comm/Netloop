package com.netloop.game.game

import kotlin.random.Random

data class Spawn(val kind: PacketKind, val atMs: Long, val cable: Int)

object WavePlan {
    fun build(wave: Int, cableCount: Int, random: Random): List<Spawn> {
        val threats = PacketKind.entries.filter { it.isThreat && it.firstWave <= wave }
        val total = 6 + wave * 3
        val interval = (1300 - wave * 70).coerceAtLeast(500)
        val spawns = mutableListOf<Spawn>()
        var at = 800L
        repeat(total) {
            val cable = random.nextInt(cableCount)
            val kind = if (random.nextFloat() < 0.35f) PacketKind.LEGIT else threats.random(random)
            if (kind == PacketKind.PING_FLOOD) {
                repeat(3) { k -> spawns += Spawn(kind, at + k * 140L, cable) }
            } else {
                spawns += Spawn(kind, at, cable)
            }
            at += interval + random.nextInt(-200, 200)
        }
        return spawns.sortedBy { it.atMs }
    }
}
