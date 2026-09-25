; NSIS Custom Installer Script for The Whispering Wilds
; Ensures saves and user profiles are preserved during uninstall and reinstall

!macro customUnInstall
  ; Explicitly keep %APPDATA%\TheWhisperingWilds\saves and settings intact
  DetailPrint "Preserving user save files, profile data, and screenshots..."
!macroend
