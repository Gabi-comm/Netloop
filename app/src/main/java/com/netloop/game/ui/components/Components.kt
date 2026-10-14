package com.netloop.game.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.netloop.game.ui.sprites.AnimatedSprite
import com.netloop.game.ui.sprites.SpriteAnim
import com.netloop.game.ui.sprites.SpriteSheet
import com.netloop.game.ui.theme.NetColors
import com.netloop.game.ui.theme.NetType

@Composable
fun NetText(
    text: String,
    size: TextUnit,
    modifier: Modifier = Modifier,
    color: Color = NetColors.Chalk,
    display: Boolean = false,
    letterSpacing: TextUnit = TextUnit.Unspecified,
    lineHeight: TextUnit = TextUnit.Unspecified,
) {
    val family: FontFamily = if (display) NetType.display else NetType.body
    Text(
        text = text,
        modifier = modifier,
        color = color,
        fontSize = size,
        fontFamily = family,
        letterSpacing = letterSpacing,
        lineHeight = lineHeight,
    )
}

@Composable
fun ChunkyButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    height: Dp = 76.dp,
    fontSize: TextUnit = 46.sp,
    icon: SpriteAnim? = null,
    color: Color = NetColors.Pink,
    shadow: Color = NetColors.PinkShadow,
) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val shape = RoundedCornerShape(18.dp)
    Box(modifier.fillMaxWidth().height(height + 6.dp)) {
        Box(
            Modifier.fillMaxWidth().height(height).align(Alignment.BottomCenter).clip(shape).background(shadow),
        )
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(height)
                .offset(y = if (pressed) 6.dp else 0.dp)
                .clip(shape)
                .background(color)
                .clickable(interactionSource = interaction, indication = null, role = Role.Button, onClick = onClick),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            NetText(text, fontSize, color = NetColors.Ground, display = true, letterSpacing = 4.sp)
            if (icon != null) {
                Spacer(Modifier.width(14.dp))
                AnimatedSprite(icon, Modifier.size(26.dp))
            }
        }
    }
}

@Composable
fun OutlineTile(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    borderColor: Color = NetColors.Line,
    radius: Dp = 16.dp,
    content: @Composable () -> Unit,
) {
    val shape = RoundedCornerShape(radius)
    val base = modifier.clip(shape).background(NetColors.Surface).border(2.5.dp, borderColor, shape)
    Box(if (onClick != null) base.clickable(role = Role.Button, onClick = onClick) else base, contentAlignment = Alignment.Center) {
        content()
    }
}

@Composable
fun SquareIconButton(icon: SpriteAnim, label: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    OutlineTile(
        modifier = modifier.size(46.dp).semantics { contentDescription = label },
        onClick = onClick,
        radius = 14.dp,
    ) {
        AnimatedSprite(icon, Modifier.size(26.dp))
    }
}

@Composable
fun DataPill(amount: Int, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .clip(CircleShape)
            .background(NetColors.Surface)
            .border(2.5.dp, NetColors.Line, CircleShape)
            .padding(horizontal = 14.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        AnimatedSprite(SpriteSheet.uiData, Modifier.size(20.dp))
        NetText("%,d data".format(amount), 22.sp)
    }
}

@Composable
fun DashedRule(width: Dp, modifier: Modifier = Modifier, color: Color = NetColors.Chalk) {
    Canvas(modifier.width(width).height(10.dp)) {
        drawLine(
            color = color,
            start = Offset(4.dp.toPx(), size.height / 2),
            end = Offset(size.width - 4.dp.toPx(), size.height / 2),
            strokeWidth = 4.dp.toPx(),
            cap = StrokeCap.Round,
            pathEffect = PathEffect.dashPathEffect(floatArrayOf(14.dp.toPx(), 11.dp.toPx())),
        )
    }
}

@Composable
fun UptimeBars(current: Int, max: Int, modifier: Modifier = Modifier) {
    Row(modifier, horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
        NetText("uptime", 19.sp, color = NetColors.Muted, modifier = Modifier.padding(end = 4.dp))
        repeat(max) { i ->
            val full = i < current
            Box(
                Modifier
                    .size(18.dp, 30.dp)
                    .clip(RoundedCornerShape(6.dp))
                    .background(if (full) NetColors.Legit else NetColors.EmptyBar)
                    .then(if (full) Modifier else Modifier.border(2.dp, NetColors.Dim, RoundedCornerShape(6.dp))),
            )
        }
    }
}

@Composable
fun WaveDots(wave: Int, total: Int, modifier: Modifier = Modifier) {
    Row(modifier, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        repeat(total) { i ->
            Box(
                Modifier
                    .size(14.dp, 8.dp)
                    .clip(RoundedCornerShape(3.dp))
                    .background(if (i < wave) NetColors.Data else NetColors.Line),
            )
        }
    }
}

@Composable
fun Chip(text: String, modifier: Modifier = Modifier) {
    Box(
        modifier
            .clip(CircleShape)
            .border(2.dp, NetColors.Line, CircleShape)
            .padding(horizontal = 12.dp, vertical = 2.dp),
    ) {
        NetText(text, 19.sp)
    }
}

@Composable
fun AbilityButton(
    icon: SpriteAnim,
    label: String,
    ready: Boolean,
    accent: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Box(
            Modifier
                .size(66.dp)
                .clip(CircleShape)
                .background(NetColors.Surface)
                .border(3.dp, if (ready) accent else NetColors.Dim, CircleShape)
                .clickable(enabled = ready, role = Role.Button, onClick = onClick)
                .semantics { contentDescription = label },
            contentAlignment = Alignment.Center,
        ) {
            AnimatedSprite(icon, Modifier.size(34.dp))
        }
        NetText(label, 18.sp, color = if (ready) accent else NetColors.Muted)
    }
}
