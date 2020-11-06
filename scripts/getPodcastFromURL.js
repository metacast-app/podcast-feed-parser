const podcastFeedParser = require('../index');

(async function () {
  try {
    if (process.argv.length < 3) {
      console.log('The url parameter is required.')
      return
    }

    const url = process.argv[2]
    const result = await podcastFeedParser.getPodcastFromURL(url)
    console.log(result)

    return
  } catch (error) {
    console.log(error)
  }
})()
