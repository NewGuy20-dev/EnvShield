#!/usr/bin/env python3
"""
Git filter-repo callback to remove console.log statements from token route only
"""
import re
import sys

def blob_callback(blob, callback_metadata):
    """Remove console.log and console.error lines from token route file ONLY"""
    
    # Check if this is the token route file (try different path variations)
    path_str = blob.original_path.decode('utf-8', errors='replace')
    
    # Match the token route file
    if 'tokens/[tokenId]/route.ts' in path_str or 'tokens\\[tokenId]\\route.ts' in path_str:
        # Decode content
        content = blob.data.decode('utf-8', errors='replace')
        
        # Only process if it contains console statements
        if 'console.log' in content or 'console.error' in content:
            # Split into lines and filter out ONLY lines with console statements
            lines = content.split('\n')
            filtered_lines = []
            
            for line in lines:
                # Skip lines that contain console.log( or console.error(
                if re.search(r'console\.(log|error)\s*\(', line):
                    continue  # Skip this line completely
                filtered_lines.append(line)
            
            # Rejoin and encode
            new_content = '\n'.join(filtered_lines)
            blob.data = new_content.encode('utf-8')
