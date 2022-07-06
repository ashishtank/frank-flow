#!/bin/bash

echo "Release version: $1"

SNAPSHOT_VERSION="$1-SNAPSHOT"

mvn versions:set-property -Dproperty=nexusVersion -DnewVersion=$SNAPSHOT_VERSION