#!/bin/bash
# Scrape the full AB question bank from isradrive.info via session batches.
set -u
cd "$(dirname "$0")"
mkdir -p batches
rm -f cookies.txt batches/*.xml seen_ids.txt
touch seen_ids.txt

curl -s -c cookies.txt -b cookies.txt 'https://isradrive.info/start.php?d=AB&a=' -o batches/000.xml
i=0
while : ; do
  f=$(printf 'batches/%03d.xml' $i)
  ids=$(grep -oE 'n="[0-9]+"' "$f" | grep -oE '[0-9]+' | sort -u)
  [ -z "$ids" ] && { echo "empty batch, stop at $i"; break; }
  # stop if all ids already seen (server started repeating)
  new=$(comm -23 <(echo "$ids") <(sort -u seen_ids.txt) | wc -l | tr -d ' ')
  if [ "$new" -eq 0 ]; then echo "no new ids, stop at $i"; break; fi
  echo "$ids" >> seen_ids.txt
  if grep -q '<finish' "$f"; then echo "finish marker at $i"; break; fi
  [ $i -ge 300 ] && { echo "cap reached"; break; }
  idcsv=$(echo "$ids" | paste -sd, -)
  i=$((i+1))
  nf=$(printf 'batches/%03d.xml' $i)
  curl -s -c cookies.txt -b cookies.txt "https://isradrive.info/ques.php?n=$idcsv&w=" -o "$nf"
  sleep 0.4
done
sort -u seen_ids.txt | grep -c .
echo DONE
