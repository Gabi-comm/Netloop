package com.netloop.game.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.netloop.game.game.Patch
import com.netloop.game.game.RunState
import com.netloop.game.ui.components.ChunkyButton
import com.netloop.game.ui.components.Chip
import com.netloop.game.ui.components.DashedRule
import com.netloop.game.ui.components.NetText
import com.netloop.game.ui.sprites.AnimatedSprite
import com.netloop.game.ui.sprites.SpriteSheet
import com.netloop.game.ui.theme.NetColors

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun PowerUpScreen(run: RunState, onInstall: (Patch?) -> Unit) {
    var offers by remember(run, run.wave) { mutableStateOf(Patch.offer(run.patches, run.random)) }
    var picked by remember(offers) { mutableIntStateOf(0) }

    BackHandler { }

    Box(Modifier.fillMaxSize().background(NetColors.Ground)) {
        Column(
            Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(start = 24.dp, end = 24.dp, top = 36.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                NetText("WAVE CLEAR!", 64.sp, color = NetColors.Pink, display = true, letterSpacing = 3.sp, lineHeight = 64.sp)
                DashedRule(260.dp)
                NetText("pick 1 patch. it lasts the whole run.", 22.sp, color = NetColors.Soft, modifier = Modifier.padding(top = 8.dp))
            }

            if (offers.isEmpty()) {
                NetText("you own every patch. nothing left to install.", 22.sp, color = NetColors.Muted)
            }
            offers.forEachIndexed { i, patch ->
                PatchCard(patch, selected = i == picked) { picked = i }
            }

            Spacer(Modifier.weight(1f))

            if (run.patches.isNotEmpty()) {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    NetText("your patches:", 19.sp, color = NetColors.Muted)
                    run.patches.forEach { Chip(it.title) }
                }
            }
            ChunkyButton(
                text = if (offers.isEmpty()) "NEXT WAVE" else "INSTALL PATCH",
                onClick = { onInstall(offers.getOrNull(picked)) },
                height = 72.dp,
                fontSize = 38.sp,
            )
            Row(
                Modifier
                    .align(Alignment.CenterHorizontally)
                    .heightIn(min = 44.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .clickable(role = Role.Button) { offers = Patch.offer(run.patches, run.random) }
                    .padding(horizontal = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                AnimatedSprite(SpriteSheet.uiReroll, Modifier.size(22.dp))
                NetText("reroll (watch an ad)", 21.sp, color = NetColors.Soft)
            }
        }
    }
}

@Composable
private fun PatchCard(patch: Patch, selected: Boolean, onSelect: () -> Unit) {
    val shape = RoundedCornerShape(20.dp)
    Box(Modifier.fillMaxWidth()) {
        Row(
            Modifier
                .fillMaxWidth()
                .clip(shape)
                .background(NetColors.Surface)
                .border(3.dp, if (selected) NetColors.Pink else NetColors.Line, shape)
                .clickable(role = Role.RadioButton, onClick = onSelect)
                .semantics { this.selected = selected }
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Box(
                Modifier.size(84.dp).clip(RoundedCornerShape(18.dp)).background(NetColors.Ground),
                contentAlignment = Alignment.Center,
            ) {
                AnimatedSprite(patch.icon, Modifier.size(64.dp))
            }
            Column {
                NetText(patch.tag, 19.sp, color = patch.rarity.color, display = true, letterSpacing = 2.sp)
                NetText(patch.title, 32.sp, display = true, lineHeight = 35.sp)
                NetText(patch.description, 20.sp, color = NetColors.Muted, lineHeight = 25.sp)
            }
        }
        if (selected) {
            Box(
                Modifier
                    .align(Alignment.TopEnd)
                    .offset(x = 10.dp, y = (-12).dp)
                    .size(34.dp)
                    .clip(CircleShape)
                    .background(NetColors.Pink),
                contentAlignment = Alignment.Center,
            ) {
                AnimatedSprite(SpriteSheet.uiCheck, Modifier.size(18.dp))
            }
        }
    }
}
