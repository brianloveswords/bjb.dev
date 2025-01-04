#!/bin/bash
set -eu

usage() {
    echo "Usage: $0 [--undo] <file1> [file2] ... [fileN]"
    exit 1
}

# parse arguments
undo_mode=false

if [ "$#" -lt 1 ]; then
    usage
fi

if [ "$1" == "--undo" ]; then
    undo_mode=true
    shift
fi

main() {
    for file in "$@"; do
        # skip if the file does not exist or is not a regular file
        if [ ! -f "$file" ]; then
            echo "Skipping $file (not a valid file)"
            continue
        fi

        if $undo_mode; then
            # undo mode: remove hash from filename
            filename=$(basename -- "$file")
            extension="${filename##*.}"
            name="${filename%.*}"

            # check for hash-like pattern (32 hexadecimal characters) in the name
            new_name=$(echo "$name" | sed -E 's/\.[a-f0-9]{32}$//')

            if [ "$new_name" != "$name" ]; then
                # rename to remove the hash
                new_filename="${new_name}.${extension}"
                mv "$file" "$(dirname "$file")/$new_filename"
                echo "Renamed $filename to $new_filename"
            else
                echo "Skipping $file (no hash found)"
            fi
        else
            # normal mode: Add hash to the filename
            # extract file name and extension
            filename=$(basename -- "$file")
            extension="${filename##*.}"
            name="${filename%.*}"

            # check if the file already has a hash suffix
            if [[ "$name" =~ \.[a-f0-9]{32}$ ]]; then
                echo "Skipping $file (already has hash suffix)"
                continue
            fi

            # calculate MD5 hash of the file content
            md5_hash=$(md5 -q "$file")

            # create the new filename with MD5 hash
            new_filename="${name}.${md5_hash}.${extension}"
            mv "$file" "$(dirname "$file")/$new_filename"
            echo "Renamed $filename to $new_filename"
        fi
    done
}

main "$@"
