curl -f -X POST \
  -F "document=@./artifacts/adventures.txt;type=text/plain" \
  http://localhost:3080/api/upload