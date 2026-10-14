package com.netloop.game

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.netloop.game.game.RunState
import com.netloop.game.ui.screens.FightScreen
import com.netloop.game.ui.screens.HomeScreen
import com.netloop.game.ui.screens.PowerUpScreen

sealed interface Screen {
    data object Home : Screen
    data class Fight(val run: RunState, val wave: Int) : Screen
    data class PowerUp(val run: RunState, val wave: Int) : Screen
}

@Composable
fun NetloopApp() {
    var screen by remember { mutableStateOf<Screen>(Screen.Home) }
    var data by rememberSaveable { mutableIntStateOf(0) }
    var lastResult by rememberSaveable { mutableStateOf<String?>(null) }

    fun endRun(run: RunState, won: Boolean) {
        data += run.dataEarned + run.score / 100
        lastResult = if (won) "network secured! score ${"%,d".format(run.score)}" else "network down on wave ${run.wave}. score ${"%,d".format(run.score)}"
        screen = Screen.Home
    }

    when (val s = screen) {
        Screen.Home -> HomeScreen(
            data = data,
            lastResult = lastResult,
            onPlay = { RunState.random().let { screen = Screen.Fight(it, it.wave) } },
            onDaily = { RunState.daily().let { screen = Screen.Fight(it, it.wave) } },
            onSettings = {},
            onZones = {},
            onCodex = {},
            onShop = {},
        )
        is Screen.Fight -> FightScreen(
            run = s.run,
            onWaveCleared = {
                if (s.run.isFinalWave) endRun(s.run, won = true) else screen = Screen.PowerUp(s.run, s.run.wave)
            },
            onRunOver = { endRun(s.run, won = false) },
            onQuit = { endRun(s.run, won = false) },
        )
        is Screen.PowerUp -> PowerUpScreen(s.run) { patch ->
            if (patch != null) s.run.patches += patch
            s.run.wave += 1
            screen = Screen.Fight(s.run, s.run.wave)
        }
    }
}
