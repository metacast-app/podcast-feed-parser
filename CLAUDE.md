# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Testing
- `npm test` - Runs the test suite using Mocha
- Run tests: `mocha` or `npx mocha` (direct Mocha execution)

### Development Testing
- `npx ./scripts/getPodcastFromURL.js <podcast-feed-url>` - Test the parser against a specific podcast feed URL

### Package Management
- `npm install` - Install dependencies
- Uses npm and yarn (both package-lock.json and yarn.lock present)

## Architecture Overview

This is a Node.js package for parsing podcast RSS feeds into JavaScript objects. The core architecture consists of:

### Main Entry Point (`index.js`)
- Single-file library containing all parsing logic (~940 lines)
- Exports two main functions: `getPodcastFromURL()` (async) and `getPodcastFromFeed()` (sync)
- Uses xml2js for XML parsing and isomorphic-fetch for HTTP requests

### Core Components

**Namespace Support**: Comprehensive support for RSS and podcast namespaces including:
- iTunes tags (`itunes:*`)
- Podcast Index namespace (`podcast:*`) - supports modern podcast features like chapters, funding, transcripts, people, value blocks
- Standard RSS elements

**Field Processing System**:
- `GET` functions - Extract data from XML nodes for specific fields
- `CLEAN` functions - Normalize and standardize extracted data (e.g., duration strings to seconds)
- Configurable options for which fields to parse, clean, or mark as required

**Parsing Pipeline**:
1. Fetch/receive RSS feed XML
2. Parse XML using xml2js
3. Extract channel metadata and episode data
4. Apply field selection, cleaning, and validation based on options
5. Return structured `{meta, episodes}` object

### Key Features
- Handles complex nested podcast namespace elements (value recipients, time splits, remote items)
- Robust episode ordering (by order tag, then pubDate, then title)
- Flexible field configuration (default fields, custom fields, uncleaned fields)
- Error handling for parsing, fetching, and validation

### Test Structure
- Test files located in `test/` directory with sample XML feeds in `test/testfiles/`
- Comprehensive tests covering parsing, field options, ordering, and error cases
- Uses Mocha + Chai for testing framework

The library is designed to handle the complexity of podcast RSS feeds while providing a clean, consistent JavaScript interface for consuming applications.