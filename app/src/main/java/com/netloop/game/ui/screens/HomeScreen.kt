package com.netloop.game.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.withStyle
import androidx.compose.material3.Text
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.netloop.game.ui.components.ChunkyButton
import com.netloop.game.ui.components.DashedRule
import com.netloop.game.ui.components.DataPill
import com.netloop.game.ui.components.NetText
import com.netloop.game.ui.components.OutlineTile
import com.netloop.game.ui.components.SquareIconButton
import com.netloop.game.ui.sprites.AnimatedSprite
import com.netloop.game.ui.sprites.SpriteAnim
import com.netloop.game.ui.sprites.SpriteSheet
import com.netloop.game.ui.theme.NetColors
import com.netloop.game.ui.theme.NetType

@Composable
fun HomeScreen(
    data: Int,
    lastResult: String?,
    onPlay: () -> Unit,
    onDaily: () -> Unit,
    onSettings: () -> Unit,
    onZones: () -> Unit,
    onCodex: () -> Unit,
    onShop: () -> Unit,
) {
    Box(Modifier.fillMaxSize().background(NetColors.Ground)) {
        GroundDoodles()
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(horizontal = 24.dp, vertical = 24.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                DataPill(data)
                SquareIconButton(SpriteSheet.uiSettings, "Settings", onSettings)
            }
            Column(Modifier.fillMaxWidth().padding(top = 12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = buildAnnotatedString {
                        withStyle(SpanStyle(color = NetColors.Pink)) { append("NET") }
                        withStyle(SpanStyle(color = NetColors.Chalk)) { append("LOOP") }
                    },
                    fontFamily = NetType.display,
                    fontSize = 88.sp,
                    lineHeight = 88.sp,
                    letterSpacing = 5.sp,
                )
                DashedRule(300.dp)
                NetText(lastResult ?: "draw a loop. drop the bad packets.", 24.sp, color = NetColors.Soft, modifier = Modifier.padding(top = 10.dp))
            }
            HeroScene(Modifier.align(Alignment.CenterHorizontally))
            ChunkyButton("PLAY", onPlay, icon = SpriteSheet.uiPlay)
            NetText("home network · wave 1 of 10", 20.sp, color = NetColors.Muted, modifier = Modifier.align(Alignment.CenterHorizontally))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                MenuTile("Zones", SpriteSheet.uiZones, onZones, Modifier.weight(1f))
                MenuTile("Codex", SpriteSheet.uiCodex, onCodex, Modifier.weight(1f))
                MenuTile("Shop", SpriteSheet.uiShop, onShop, Modifier.weight(1f))
            }
            DailyIncidentCard(onDaily)
        }
    }
}

@Composable
private fun MenuTile(label: String, icon: SpriteAnim, onClick: () -> Unit, modifier: Modifier) {
    OutlineTile(modifier.height(86.dp), onClick = onClick) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
            AnimatedSprite(icon, Modifier.size(32.dp))
            NetText(label, 21.sp)
        }
    }
}

@Composable
private fun DailyIncidentCard(onDaily: () -> Unit) {
    val shape = RoundedCornerShape(16.dp)
    Row(
        Modifier
            .fillMaxWidth()
            .clip(shape)
            .clickable(role = Role.Button, onClick = onDaily)
            .dashedBorder(NetColors.Points, 16.dp)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column {
            NetText("DAILY INCIDENT", 26.sp, color = NetColors.Points, display = true, letterSpacing = 1.sp)
            NetText("same run for everyone", 19.sp, color = NetColors.Muted)
        }
        Box(
            Modifier
                .size(48.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(NetColors.Points)
                .semantics { contentDescription = "Play the daily incident" },
            contentAlignment = Alignment.Center,
        ) {
            AnimatedSprite(SpriteSheet.uiArrow, Modifier.size(22.dp))
        }
    }
}

private fun Modifier.dashedBorder(color: Color, radius: Dp): Modifier = drawBehind {
    val inset = 1.25.dp.toPx()
    drawRoundRect(
        color = color,
        topLeft = Offset(inset, inset),
        size = Size(size.width - inset * 2, size.height - inset * 2),
        cornerRadius = CornerRadius(radius.toPx()),
        style = Stroke(width = 2.5.dp.toPx(), pathEffect = PathEffect.dashPathEffect(floatArrayOf(10.dp.toPx(), 7.dp.toPx()))),
    )
}

@Composable
private fun HeroScene(modifier: Modifier = Modifier) {
    val loop = PathParser().parsePathString("M84 104 Q76 52 134 44 Q198 34 214 86 Q228 140 170 156 Q98 172 84 108 Q82 96 90 84").toPath()
    val cloud = PathParser().parsePathString("M196 228 Q192 186 232 178 Q262 158 300 168 Q342 168 342 204 L342 228 Z").toPath()
    Box(modifier.size(342.dp, 228.dp)) {
        Canvas(Modifier.fillMaxSize()) {
            scale(size.width / 342f, size.height / 228f, pivot = Offset.Zero) {
                drawPath(cloud, NetColors.Server)
                drawPath(loop, NetColors.Chalk, style = Stroke(width = 5f, cap = StrokeCap.Round))
                drawCircle(NetColors.Points, 5f, Offset(40f, 30f))
                drawCircle(NetColors.Points, 4f, Offset(54f, 22f))
                drawCircle(NetColors.Points, 4.5f, Offset(58f, 36f))
            }
        }
        Placed(SpriteSheet.serverIdle, 246.dp, 116.dp, 86.dp)
        Placed(SpriteSheet.malwareWalk, 104.dp, 62.dp, 52.dp)
        Placed(SpriteSheet.malwareWalk, 146.dp, 90.dp, 50.dp)
        Placed(SpriteSheet.legitWalk, 246.dp, 6.dp, 50.dp)
        Placed(SpriteSheet.bitIdle, 4.dp, 120.dp, 100.dp)
    }
}

@Composable
private fun Placed(anim: SpriteAnim, x: Dp, y: Dp, size: Dp) {
    AnimatedSprite(anim, Modifier.offset(x, y).size(size))
}

@Composable
private fun GroundDoodles() {
    Canvas(Modifier.fillMaxSize()) {
        val sx = size.width / 390f
        val sy = size.height / 844f
        val tufts = listOf(40f to 120f, 318f to 96f, 24f to 470f, 352f to 520f, 180f to 806f, 300f to 640f, 60f to 700f)
        tufts.forEach { (x, y) ->
            val o = Offset(x * sx, y * sy)
            drawLine(NetColors.Line, o, o + Offset(3f * sx, -10f * sy), 2.5f * sx, StrokeCap.Round)
            drawLine(NetColors.Line, o + Offset(7f * sx, 0f), o + Offset(7f * sx, -11f * sy), 2.5f * sx, StrokeCap.Round)
            drawLine(NetColors.Line, o + Offset(13f * sx, 0f), o + Offset(11f * sx, -9f * sy), 2.5f * sx, StrokeCap.Round)
        }
    }
}
