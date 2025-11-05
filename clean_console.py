#!/usr/bin/env python3
"""
Remove console.log and console.error statements from token route file
"""
import sys
import re

def filter_file(data):
    """Remove console.log and console.error lines from the file"""
    text = data.decode('utf-8', errors='replace')
    
    # Split by lines and filter out console lines
    lines = text.split('\n')
    filtered = []
    
    for line in lines:
        # Skip lines containing console.log or console.error
        if 'console.log' in line or 'console.error' in line:
            continue
        filtered.append(line)
    
    result = '\n'.join(filtered)
    return result.encode('utf-8')

if __name__ == '__main__':
    data = sys.stdin.buffer.read()
    output = filter_file(data)
    sys.stdout.buffer.write(output)
