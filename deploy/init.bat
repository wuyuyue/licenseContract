
rm -f zos.%1.json
rm -rf build
zos add License & zos push --network  %1 & zos create License --init initialize --args 0x0a1d3effa44dd3d145e6705ed9953bd6f07539c3  --network  %1
