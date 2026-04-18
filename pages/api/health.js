export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    commit: process.env.NEXT_PUBLIC_GIT_SHA ?? 'unknown',
    commitFull: process.env.NEXT_PUBLIC_GIT_SHA_FULL ?? 'unknown',
    builtAt: process.env.NEXT_PUBLIC_BUILD_TIME ?? 'unknown',
    checkedAt: new Date().toISOString(),
  });
}
