let introEndsAt = 0;

export function holdForIntro(ms: number) {
  introEndsAt = Date.now() + ms;
}

export function releaseIntro() {
  introEndsAt = 0;
}

export function introRemainingMs() {
  return Math.max(0, introEndsAt - Date.now());
}
