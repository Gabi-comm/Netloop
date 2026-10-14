package com.netloop.game.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider

private val scheme = darkColorScheme(
    primary = NetColors.Pink,
    onPrimary = NetColors.Ground,
    background = NetColors.Ground,
    onBackground = NetColors.Chalk,
    surface = NetColors.Surface,
    onSurface = NetColors.Chalk,
    outline = NetColors.Line,
)

@Composable
fun NetloopTheme(content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalNetFonts provides rememberNetFonts()) {
        MaterialTheme(colorScheme = scheme, content = content)
    }
}
