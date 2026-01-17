export type Part =
  | { type: "text"; text: string }
  | { type: "tool-result"; state: "output-available"; output: any };

export type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  parts: Part[];
};