@echo off
python D:\sti_wangyang\ras_update_date.py
IF %ERRORLEVEL% EQU 0 (
    echo Success Run
) ELSE (
    echo Error: Script failed with exit code %ERRORLEVEL%.
)
pause
