// ============================================================
// token.ts
//   回答者用 access_token を生成する。
//   32 byte ランダム → base64url（44 文字弱）。
// ============================================================
import { randomBytes } from "node:crypto";

export const generateAccessToken = (): string =>
  randomBytes(32).toString("base64url");
