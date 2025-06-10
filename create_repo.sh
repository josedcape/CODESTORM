#!/bin/bash

# Reemplaza estos valores con tus propios datos
TOKEN="TU_TOKEN_AQUI"
REPO_NAME="CODESTORM"
REPO_DESCRIPTION="Agente Desarrollador Autónomo que utiliza modelos de IA para generar código"
VISIBILITY="public"  # o "private" si prefieres un repositorio privado

# Crear el repositorio
curl -X POST \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"$REPO_DESCRIPTION\",\"private\":$([ "$VISIBILITY" = "private" ] && echo "true" || echo "false")}"

echo "Repositorio creado: https://github.com/$(curl -s -H "Authorization: token $TOKEN" https://api.github.com/user | grep -o '"login": "[^"]*' | cut -d'"' -f4)/$REPO_NAME"
