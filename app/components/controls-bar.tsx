import React from "react";

type ControlsBarProps = {
  isStop: boolean;
  onClickToggle: () => void;
  onClickGrowOnce: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onClickRestart: () => void;
};

export function ControlsBar({
  isStop,
  onClickToggle,
  onClickGrowOnce,
  onClickRestart,
}: ControlsBarProps) {
  return (
    <div className="fixed bottom-0 items-center w-screen">
      <div className="items-center w-full flex justify-center flex-row space-x-2">
        <button
          type="button"
          className="w-36 border-2 border-white bg-black bg-opacity-60 text-white py-2 px-4 rounded-lg hover:border-gray-600"
          onClick={onClickToggle}
        >
          {isStop ? "Start" : "Stop"}
        </button>
        <button
          type="button"
          className={`w-36 border-2 border-white bg-black bg-opacity-60 text-white py-2 px-4 rounded-lg hover:border-gray-600 ${
            isStop ? "" : "pointer-events-none opacity-50"
          }`}
          onClick={onClickGrowOnce}
        >
          Grow Once
        </button>
        <button
          type="button"
          className="w-36 border-2 border-white bg-black bg-opacity-60 text-white py-2 px-4 rounded-lg hover:border-gray-600"
          onClick={onClickRestart}
        >
          Restart
        </button>
      </div>
    </div>
  );
}
