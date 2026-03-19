"use client";

const EMOJIS = ["📄", "🧠", "✅", "📌", "🚀", "📚", "📝", "🎯", "💡", "📦"];

type EmojiPickerProps = {
  onPick: (emoji: string) => void;
};

export function EmojiPicker({ onPick }: EmojiPickerProps): JSX.Element {
  return (
    <div className="grid grid-cols-5 gap-2 rounded-md border bg-card p-2">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          className="rounded-md p-2 hover:bg-accent"
          type="button"
          onClick={() => onPick(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
