import { useState, useEffect } from 'react';

export default function PlayerSettings() {

    const [pythonPath, setPythonPath] = useState('');

    const handleSelectPythonPath = async () => {
        const path = await window.electron.selectFile(); // or selectFile
        if (path) {
            await window.electron.storeSet("pythonpath", path)
            setPythonPath(path);
        }
    };

    useEffect(() => {
        const loadPythonPath = async () => {
            const storedPath = await window.electron.storeGet('pythonpath');
            if (storedPath) {
                setPythonPath(storedPath);
            }
        };
        loadPythonPath();
    }, []);


    return (
        <div className="flex-grow flex flex-col items-center justify-center bg-zinc-900 gap-8 pt-4 pb-8">
            <div className="bg-zinc-800 p-8 flex flex-col gap-6 items-center justify-center border rounded-lg">
                <p className="text-2xl font-bold text-zinc-50">Select Python Path</p>

                <button
                    onClick={handleSelectPythonPath}
                    className="w-full min-w-[500px] px-8 py-12 bg-zinc-700 text-zinc-200 border-2 border-zinc-600 rounded-lg hover:bg-zinc-600 hover:border-zinc-500 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer"
                >
                    <svg
                        className="w-16 h-16 text-zinc-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    <span className="text-xl font-semibold">Click to Select Python Executable</span>
                    {/* {pythonPath && (
                        <span className="text-sm text-zinc-400 break-all text-center max-w-[450px]">
                            {pythonPath}
                        </span>
                    )} */}
                </button>

                {pythonPath && (
                    <div className="flex flex-col items-center gap-2 w-full">
                        <p className="text-sm text-zinc-400">Current Path:</p>
                        <p className="text-zinc-200 font-mono text-sm bg-zinc-900 px-4 py-2 rounded border border-zinc-700 break-all max-w-[500px]">
                            {pythonPath}
                        </p>
                    </div>
                )}

            </div>
        </div>
    )
}