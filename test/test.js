const chai = require('chai')
const expect = chai.expect
const chaiAsPromised = require('chai-as-promised')
const fs = require('fs')
const path = require('path')
const podcastFeedParser = require('../index')
const ERRORS = podcastFeedParser.ERRORS

const testFilesPath = path.join(__dirname, 'testfiles')

const sampleFeedUrl = 'https://feeds.transistor.fm/metacast-behind-the-scenes'
const invalidFeedUrl = 'http://metacast.app/random-non-existing-url'

const testFeedPath = path.join(testFilesPath, 'bgb-sample.xml')
const badTestFeedPath = path.join(testFilesPath, 'bc-sample-bad.xml')
const customTagsTestFeedPath = path.join(
  testFilesPath,
  'bc-sample-custom-tags.xml'
)
const orderTestFeedPath = path.join(testFilesPath, 'bc-sample-order.xml')
const replyAllOrderingTestFeedPath = path.join(
  testFilesPath,
  'replyall-sample-ordering.xml'
)
const newFeedUrlTestFeedPath = path.join(
  testFilesPath,
  'bc-sample-new-feed-url.xml'
)
const namespaceTestFeedPath = path.join(testFilesPath, 'namespace-sample.xml')

chai.use(chaiAsPromised.default || chaiAsPromised)

describe('Reading files', function () {
  it('should read the file', function () {
    expect(fs.readFileSync(testFeedPath, 'utf8')).to.be.a('string')
  })
})

describe('Fetching Feeds', function () {
  it('should fetch the feed and receive a promise', async function () {
    expect(podcastFeedParser.getPodcastFromURL({ url: sampleFeedUrl })).to.be.a(
      'promise'
    )
  })
  it('should fetch the feed and receive a promise that is fulfilled', async function () {
    await expect(podcastFeedParser.getPodcastFromURL({ url: sampleFeedUrl })).to
      .eventually.be.fulfilled
  })
  it('should fetch the feed and receive a promise that is rejected', async function () {
    await expect(
      podcastFeedParser.getPodcastFromURL({
        url: invalidFeedUrl
      })
    ).to.eventually.be.rejected
  })
})

describe('Parsing Local Feeds', function () {
  const sampleFeed = fs.readFileSync(testFeedPath, 'utf8').toString()
  const badSampleFeed = fs.readFileSync(badTestFeedPath, 'utf8').toString()

  it('should parse the feed and return a Podcast object', function () {
    expect(podcastFeedParser.getPodcastFromFeed(sampleFeed))
      .to.be.an('object')
      .that.contains.keys('meta', 'episodes')
  })
  it('should parse a bad feed and return an error', function () {
    expect(
      podcastFeedParser.getPodcastFromFeed.bind(
        podcastFeedParser,
        badSampleFeed
      )
    ).to.throw(ERRORS.parsingError)
  })
})

describe('Getting Podcast Object from Sample Feed', function () {
  const sampleFeed = fs.readFileSync(testFeedPath, 'utf8').toString()
  const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed)

  it('should be a valid Podcast Object', function () {
    expect(podcast).to.be.an('object').that.contains.keys('meta', 'episodes')
  })

  describe('Checking Podcast Meta Information', function () {
    it('should be a valid object with all default fields', function () {
      expect(podcast.meta)
        .to.be.an('object')
        .that.contains.keys(
          'title',
          'description',
          'subtitle',
          'imageURL',
          'lastBuildDate',
          'link',
          'language',
          'editor',
          'author',
          'summary',
          'categories',
          'owner',
          'explicit',
          'complete',
          'blocked'
        )
    })
    it('should have expected information', function () {
      expect(podcast.meta.title).to.equal('Builders Gonna Build')
      expect(podcast.meta.description).to.equal(
        'Interviews with people who build awesome products, businesses and experiences. Hosted by Metacast co-founders Ilya Bezdelev and Arnab Deka.'
      )
      expect(podcast.meta.subtitle).to.equal(
        'Interviews with people who build awesome products, businesses and experiences.'
      )
      expect(podcast.meta.imageURL).to.equal(
        'https://img.transistor.fm/TCf0WdRRgh7nZPvIKSF5jsexIXmo8HCQjVJ2qSkE9p0/rs:fill:3000:3000:1/q:60/aHR0cHM6Ly9pbWct/dXBsb2FkLXByb2R1/Y3Rpb24udHJhbnNp/c3Rvci5mbS9zaG93/LzUwOTAxLzE3MTAz/NTM3NTEtYXJ0d29y/ay5qcGc.jpg'
      )
      expect(podcast.meta.lastBuildDate).to.equal(
        'Fri, 21 Feb 2025 04:28:09 -0500'
      )
      expect(podcast.meta.link).to.equal(
        'https://metacast.app/builders-gonna-build'
      )
      expect(podcast.meta.language).to.equal('en')
      expect(podcast.meta.author).to.eql('Metacast')
      expect(podcast.meta.summary).to.equal(
        'Interviews with people who build awesome products, businesses and experiences. Hosted by Metacast co-founders Ilya Bezdelev and Arnab Deka.'
      )
      expect(podcast.meta.categories).to.eql(['Business>Entrepreneurship'])
      expect(podcast.meta.owner).to.eql({
        name: 'Metacast'
      })
      expect(podcast.meta.explicit).to.equal(false)
      expect(podcast.meta.complete).to.equal(false)
      expect(podcast.meta.blocked).to.be.undefined
    })
  })

  describe('Checking Podcast Episode Information', function () {
    it('should have expected number of episodes', function () {
      expect(podcast.episodes).to.have.length(8)
    })

    it('should list episodes in order of newest to oldest', function () {
      expect(podcast.episodes[0].title).to.be.equal(
        '2. Justin Frankel, creator of Winamp and Reaper'
      )
      expect(podcast.episodes[3].title).to.be.equal(
        '3. Dennis E. Taylor, author of best-selling sci-fi series Bobiverse'
      )
    })

    describe('Checking Episode of Podcast', function () {
      it('should be a valid object with all default fields', function () {
        expect(podcast.episodes[0])
          .to.be.an('object')
          .that.contains.keys(
            'title',
            'description',
            'subtitle',
            'imageURL',
            'pubDate',
            'link',
            'language',
            'enclosure',
            'duration',
            'summary',
            'blocked',
            'explicit',
            'order'
          )
      })

      it('should have expected information', function () {
        expect(podcast.episodes[0].title).to.equal(
          '2. Justin Frankel, creator of Winamp and Reaper'
        )
        expect(podcast.episodes[0].description).to.contain(
          '<p>Justin shares how he created Winamp and sold it to AOL at age 20 and tells us about his current project, digital audio workstation (DAW) Reaper.</p>'
        )
        expect(podcast.episodes[0].imageURL).to.equal(
          'https://img.transistor.fm/TFX9wYjKIxWvKMDm0SsN9zrAoGNfhm6q7tIBoLlN-WA/rs:fill:3000:3000:1/q:60/aHR0cHM6Ly9pbWct/dXBsb2FkLXByb2R1/Y3Rpb24udHJhbnNp/c3Rvci5mbS9lcGlz/b2RlLzE3ODg1OTAv/MTcxMDM1Mzc3NC1h/cnR3b3JrLmpwZw.jpg'
        )
        expect(podcast.episodes[0].pubDate).to.equal(
          'Wed, 31 Jan 2024 03:30:00 -0500'
        )
        expect(podcast.episodes[0].link).to.equal(
          'https://share.transistor.fm/s/ff90ba08'
        )
        expect(podcast.episodes[0].language).to.be.undefined
        expect(podcast.episodes[0].enclosure).to.eql({
          length: '78787545',
          type: 'audio/mpeg',
          url: 'https://media.transistor.fm/ff90ba08/6c2fa52f.mp3'
        })
        expect(podcast.episodes[0].duration).to.equal(3283)
        expect(podcast.episodes[0].blocked).to.be.undefined
        expect(podcast.episodes[0].order).to.be.undefined
      })
    })
  })
})

describe('Checking custom options', function () {
  const sampleFeed = fs.readFileSync(customTagsTestFeedPath, 'utf8').toString()
  it('should return object with all default fields when no options object is provided', function () {
    const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed)
    expect(podcast.meta)
      .to.be.an('object')
      .that.contains.keys(
        'title',
        'description',
        'subtitle',
        'imageURL',
        'lastBuildDate',
        'link',
        'language',
        'editor',
        'author',
        'summary',
        'categories',
        'owner',
        'explicit',
        'complete',
        'blocked'
      )
    expect(podcast.episodes[0])
      .to.be.an('object')
      .that.contains.keys(
        'title',
        'description',
        'subtitle',
        'imageURL',
        'pubDate',
        'link',
        'language',
        'enclosure',
        'duration',
        'summary',
        'blocked',
        'explicit',
        'order'
      )
  })

  it('should return object with all default fields when default is specified in options object', function () {
    const options = {
      fields: {
        meta: ['default'],
        episodes: ['default']
      }
    }
    const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed, options)
    expect(podcast.meta)
      .to.be.an('object')
      .that.contains.keys(
        'title',
        'description',
        'subtitle',
        'imageURL',
        'lastBuildDate',
        'link',
        'language',
        'editor',
        'author',
        'summary',
        'categories',
        'owner',
        'explicit',
        'complete',
        'blocked'
      )
    expect(podcast.episodes[0])
      .to.be.an('object')
      .that.contains.keys(
        'title',
        'description',
        'subtitle',
        'imageURL',
        'pubDate',
        'link',
        'language',
        'enclosure',
        'duration',
        'summary',
        'blocked',
        'explicit',
        'order'
      )
  })

  it('should return object with default fields + custom field', function () {
    const options = {
      fields: {
        meta: ['default', 'webMaster'],
        episodes: ['default', 'timeline']
      }
    }
    const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed, options)
    expect(podcast.meta)
      .to.be.an('object')
      .that.contains.keys(
        'title',
        'description',
        'subtitle',
        'imageURL',
        'lastBuildDate',
        'link',
        'language',
        'editor',
        'author',
        'summary',
        'categories',
        'owner',
        'explicit',
        'complete',
        'blocked',
        'webMaster'
      )
    expect(podcast.episodes[0])
      .to.be.an('object')
      .that.contains.keys(
        'title',
        'description',
        'subtitle',
        'imageURL',
        'pubDate',
        'link',
        'language',
        'enclosure',
        'duration',
        'summary',
        'blocked',
        'explicit',
        'order',
        'timeline'
      )
  })

  it('should return object with only given custom fields', function () {
    const options = {
      fields: {
        meta: ['title', 'description', 'webMaster'],
        episodes: ['title', 'pubDate', 'timeline']
      }
    }
    const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed, options)
    expect(podcast.meta)
      .to.be.an('object')
      .that.contains.keys('title', 'description', 'webMaster')
    expect(podcast.episodes[0])
      .to.be.an('object')
      .that.contains.keys('title', 'pubDate', 'timeline')
  })

  it('should return valid object because required field exists', function () {
    const options = {
      required: {
        meta: ['title'],
        episodes: ['pubDate']
      }
    }
    const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed, options)
    expect(podcast.episodes[0]).to.be.an('object')
  })

  it('should throw a requiredError because of missing required fields', function () {
    const options = {
      required: {
        meta: ['booklink']
      }
    }
    expect(
      podcastFeedParser.getPodcastFromFeed.bind(
        podcastFeedParser,
        sampleFeed,
        options
      )
    ).to.throw(ERRORS.requiredError)
  })

  it('should return an object with uncleaned title field', function () {
    const options = {
      uncleaned: {
        meta: 'title'
      }
    }
    const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed, options)
    expect(podcast.meta.title).to.be.equal('All Things Chemical')
  })

  it('should return an object with uncleaned duration field', function () {
    const options = {
      uncleaned: {
        episodes: ['duration']
      }
    }
    const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed, options)
    expect(podcast.episodes[0].duration[0]).to.be.a('string')
  })
})

describe('Checking re-ordering functionality', function () {
  it('should list episodes in order described by order tags in the rss feed', function () {
    const sampleFeed = fs.readFileSync(orderTestFeedPath, 'utf8').toString()
    const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed)
    expect(podcast.episodes[3].title).to.equal(
      'Chemical Regulation in the Middle East'
    ) // order 1
    expect(podcast.episodes[2].title).to.equal('Animal Testing and New TSCA') // order 2
    expect(podcast.episodes[1].title).to.equal(
      'Confidential Business Information under TSCA'
    ) // default ordering by pubDate
  })

  it('should order by title when no order is specified and pubDate is the same', async function () {
    const sampleFeed = fs
      .readFileSync(replyAllOrderingTestFeedPath, 'utf8')
      .toString()
    const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed)
    expect(podcast.episodes[2].title).to.equal('#1 A Stranger Says I Love You') // first by pubDate
    expect(podcast.episodes[1].title).to.equal(
      '#2 The Secret, Gruesome Internet For Doctors'
    ) // pubDate is the same, order by title
    expect(podcast.episodes[0].title).to.equal('Reply All Mic Test') // pubDate is the same, order by title
  })
})

describe('Checking handling of new-feed-url', function () {
  it('should ignore new-feed-url element and parse feed normally', function () {
    const sampleFeed = fs
      .readFileSync(newFeedUrlTestFeedPath, 'utf8')
      .toString()
    const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed)
    expect(podcast.meta.title).to.equal('All Things Chemical')
  })
})

describe('Checking namespace attribute handling', function () {
  const sampleFeed = fs.readFileSync(namespaceTestFeedPath, 'utf8').toString()
  const podcast = podcastFeedParser.getPodcastFromFeed(sampleFeed)

  describe('Podcast metadata with namespaces', function () {
    it('should parse podcast meta information correctly', function () {
      expect(podcast.meta.title).to.equal('Test Podcast with Namespaces')
      expect(podcast.meta.description).to.equal(
        'A test podcast for testing namespace handling in podcast feed parser'
      )
      expect(podcast.meta.subtitle).to.equal(
        'Test subtitle with namespace attributes'
      )
      expect(podcast.meta.author).to.equal('Test Author')
      expect(podcast.meta.summary).to.equal(
        'Test summary with namespace declarations'
      )
      expect(podcast.meta.language).to.equal('en-us')
      expect(podcast.meta.link).to.equal('https://example.com')
      expect(podcast.meta.imageURL).to.equal('https://example.com/artwork.jpg')
    })

    it('should handle explicit and complete fields with namespaces', function () {
      expect(podcast.meta.explicit).to.equal(false)
      expect(podcast.meta.complete).to.equal(false)
    })

    it('should parse owner information correctly', function () {
      expect(podcast.meta.owner).to.eql({
        name: 'Test Owner',
        email: 'test@example.com'
      })
    })

    it('should parse categories correctly', function () {
      expect(podcast.meta.categories).to.include('Technology>Software How-To')
      expect(podcast.meta.categories).to.include('Education>Courses')
    })

    it('should parse keywords correctly', function () {
      expect(podcast.meta.keywords).to.equal(
        'test, podcast, namespace, xml, parser'
      )
    })
  })

  describe('Episode handling with namespaces', function () {
    it('should have the correct number of episodes', function () {
      expect(podcast.episodes).to.have.length(3)
    })

    it('should parse episode with numeric duration correctly', function () {
      const episode = podcast.episodes.find(
        (ep) => ep.title === 'Episode 1: Testing with Numeric Duration'
      )
      expect(episode).to.not.be.undefined
      expect(episode.duration).to.equal(1800)
      expect(episode.explicit).to.equal(false)
      expect(episode.subtitle).to.equal('Episode subtitle with namespace')
      expect(episode.keywords).to.equal('test, episode, duration')
    })

    it('should handle empty duration field gracefully', function () {
      const episode = podcast.episodes.find(
        (ep) => ep.title === 'Episode 2: Testing Empty Duration'
      )
      expect(episode).to.not.be.undefined
      expect(episode.duration).to.be.null
      expect(episode.explicit).to.equal(true)
      expect(episode.subtitle).to.equal('Testing empty duration field')
    })

    it('should parse time format duration correctly', function () {
      const episode = podcast.episodes.find(
        (ep) => ep.title === 'Episode 3: Testing Time Format Duration'
      )
      expect(episode).to.not.be.undefined
      expect(episode.duration).to.equal(2730) // 45:30 = 45*60 + 30 = 2730 seconds
      expect(episode.explicit).to.equal(false)
      expect(episode.subtitle).to.equal('Testing time format duration')
    })

    it('should parse enclosure information correctly', function () {
      const episode1 = podcast.episodes.find(
        (ep) => ep.title === 'Episode 1: Testing with Numeric Duration'
      )
      expect(episode1.enclosure).to.eql({
        length: '25000000',
        type: 'audio/mpeg',
        url: 'https://example.com/episode1.mp3'
      })
    })
  })
})
