# How to make contributions #

## Requirements ##

Node.js 10+

## Getting started ##

To get started, create your own fork of the podverse/podcast-feed-parser repo, then clone your repo locally.

Create a branch for your work that indicates what changes you will make. For example, if you were going to add support for the `<podcast:location>` tag, you could name the branch something like:

`podcastLocationTag`

## Development workflow ##

The workflow I've used for podcast-feed-parser is pretty simple. Basically I open the podcast-feed-parser/index.js file, then make changes, then test the changes by running the command:

`npx ./scripts/getPodcastFromURL.js https://engineered.network/causality/feed/index.xml`

The result of running the feed parser on that URL will be console logged in the terminal.

Ideally we will have a sample RSS feed and basic app server within this repo that contains examples of every possible namespace. (I just created 2 Github issues for this work.) Until then, I have been using the Causality podcast's RSS feed for development testing because @johnchidgey makes great use of many RSS namespaces.

## Adding tests ##

We don't actually require unit tests currently 😬 Tbh our core team is not very fluent in unit tests. If you would like to add unit tests, or could help us with creating and maintaining unit tests in general, we would greatly appreciate it.

## Making a pull request ##

When you have a feature completed on your forked repo, create a pull request to merge your changes into the develop branch of podverse/podcast-feed-parser.

## Suggestions? ##

Any suggested improvements to any Podverse documentation or processes would be greatly appreciated.

## Contact us ##

If you have any questions, please feel free to reach us on our [Discord server](https://discord.gg/6HkyNKR), or email us at contact@podverse.fm, or create a Github issue for your question.

Thank you!
