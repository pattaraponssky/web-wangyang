@echo off
python D:\sti_wangyang\hec_ras_compute.py
IF %ERRORLEVEL% EQU 0 (
    echo Success Run
) ELSE (
    echo Error: Script failed with exit code %ERRORLEVEL%.
)
pause
