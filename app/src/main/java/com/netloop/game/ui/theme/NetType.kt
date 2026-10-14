package com.netloop.game.ui.theme

import android.annotation.SuppressLint
import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily

data class NetFonts(val display: FontFamily, val body: FontFamily)

val LocalNetFonts = staticCompositionLocalOf { NetFonts(FontFamily.Cursive, FontFamily.Cursive) }

object NetType {
    val display: FontFamily
        @Composable get() = LocalNetFonts.current.display
    val body: FontFamily
        @Composable get() = LocalNetFonts.current.body
}

@Composable
fun rememberNetFonts(): NetFonts {
    val context = LocalContext.current
    return remember {
        NetFonts(
            display = fontOrFallback(context, "gochi_hand"),
            body = fontOrFallback(context, "patrick_hand"),
        )
    }
}

@SuppressLint("DiscouragedApi")
private fun fontOrFallback(context: Context, name: String): FontFamily {
    val id = context.resources.getIdentifier(name, "font", context.packageName)
    return if (id != 0) FontFamily(Font(id)) else FontFamily.Cursive
}
