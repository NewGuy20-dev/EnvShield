#!/usr/bin/env python3
"""
Remove console.log statements from app/api/v1/tokens/[tokenId]/route.ts
"""
import sys

def filter_file(blob):
    if blob.path == b'app/api/v1/tokens/[tokenId]/route.ts':
        content = blob.data.decode('utf-8')
        
        # Remove console.log lines
        lines = content.split('\n')
        filtered_lines = []
        
        for line in lines:
            # Skip lines that are console.log statements
            if 'console.log' in line or 'console.error' in line:
                # Skip the line entirely
                continue
            filtered_lines.append(line)
        
        new_content = '\n'.join(filtered_lines)
        blob.data = new_content.encode('utf-8')
    
    return blob

if __name__ == '__main__':
    blob = sys.stdin.buffer.read()
    # This is a placeholder - filter-repo will handle the actual filtering
    pass
