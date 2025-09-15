#!/bin/bash                                                                                                            

# 현재 디렉토리를 기준으로 파일 복사 및 이동
cp ../GLOBAL-setting-files/* .
cp ../GLOBAL-setting-files/.gitignore .
mkdir -p .claude
[ -f settings.local.json ] && mv settings.local.json .claude || echo "Error: settings.local.json not found"
