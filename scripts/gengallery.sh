#!/bin/bash
set -eu

main() {
  # Check if at least one argument (file) is provided
  if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <file1> [file2 ...]"
    exit 1
  fi

  # Base URL for the `src` attribute in the HTML
  BASE_URL="/"

  # Loop through all provided files
  for file in "$@"; do
    # Ensure the file exists
    if [ ! -f "$file" ]; then
      echo "File $file does not exist, skipping." >&2
      continue
    fi

    # Get the dimensions of the image
    dimensions=$(magick identify -format "%wx%h" "$file" 2>/dev/null)
    if [ $? -ne 0 ]; then
      echo "Failed to get dimensions for $file, skipping." >&2
      continue
    fi

    # Extract width and height
    width=$(echo "$dimensions" | cut -dx -f1)
    height=$(echo "$dimensions" | cut -dx -f2)

    # Remove leading "public/" from the file path
    relative_path=${file#public/}

    # Generate the base64-encoded data URL for the background
    data=$(magick "$file" -resize 5% -blur 0x3 - | base64)
    if [ -z "$data" ]; then
      echo "Failed to generate data URL for $file, skipping." >&2
      continue
    fi

    # Output the HTML <img> tag with the data URL in the background style
    echo "<img loading=lazy src=\"$BASE_URL$relative_path\" width=\"$width\" height=\"$height\" style=\"background: url('data:image/avif;base64,$data');\">"
  done
}

main "$@"
