const fetch = require('isomorphic-fetch')
const parseString = require('xml2js').parseString

const ERRORS = exports.ERRORS = {
  'parsingError' : new Error("Parsing error."),
  'requiredError' : new Error("One or more required values are missing from feed."),
  'fetchingError' : new Error("Fetching error."),
  'optionsError' : new Error("Invalid options.")
}

/*
============================================
=== CONSTANTS ===
============================================
*/
const NS = rssFeedNamespaces = {
  itunesAuthor: 'itunes:author',
  itunesBlock: 'itunes:block',
  itunesCategory: 'itunes:category',
  itunesComplete: 'itunes:complete',
  itunesDuration: 'itunes:duration',
  itunesEmail: 'itunes:email',
  itunesExplicit: 'itunes:explicit',
  itunesImage: 'itunes:image',
  itunesKeywords: 'itunes:keywords',
  itunesName: 'itunes:name',
  itunesOrder: 'itunes:order',
  itunesOwner: 'itunes:owner',
  itunesSubtitle: 'itunes:subtitle',
  itunesSummary: 'itunes:summary',
  itunesType: 'itunes:type',
  podcastChapters: 'podcast:chapters',
  podcastFunding: 'podcast:funding',
  podcastLocked: 'podcast:locked',
  podcastTranscript: 'podcast:transcript',
  podcastValue: 'podcast:value',
  podcastValueRecipient: 'podcast:valueRecipient'
}

/*
============================================
=== DEFAULT OPTIONS and OPTIONS BUILDING ===
============================================
*/

const fieldsMeta = [
  'title',
  'author',
  'blocked',
  'categories',
  'complete',
  'description',
  'docs',
  'editor',
  'explicit',
  'funding',
  'generator',
  'guid',
  'imageURL',
  'keywords',
  'language',
  'lastBuildDate',
  'link',
  'locked',
  'pubDate',
  'owner',
  'subtitle',
  'summary',
  'type',
  'value',
  'webMaster'
]

const fieldsEpisodes = [
  'title',
  'author',
  'blocked',
  'chapters',
  'description',
  'duration',
  'enclosure',
  'explicit',
  'funding',
  'guid',
  'imageURL',
  'keywords',
  'language',
  'link',
  'order',
  'pubDate',
  'subtitle',
  'summary',
  'transcript'
]

const requiredMeta = []
const requiredEpisodes = []

const uncleanedMeta = [
  'categories',
  'funding',
  'guid'
]
const uncleanedEpisodes = [
  'funding',
  'guid',
  'transcript'
]

const DEFAULT = exports.DEFAULT = {
  fields: {
    meta: fieldsMeta,
    episodes: fieldsEpisodes
  },
  required: {
    meta: requiredMeta,
    episodes: requiredEpisodes
  },
  uncleaned: {
    meta: uncleanedMeta,
    episodes: uncleanedEpisodes
  }
}

// from https://stackoverflow.com/questions/1584370/how-to-merge-two-arrays-in-javascript-and-de-duplicate-items
function mergeDedupe(arr)
{
  return [...new Set([].concat(...arr))];
}

const buildOptions = exports.buildOptions = function (params) {
  try {
    let options = {
      fields: {
        meta: fieldsMeta,
        episodes: fieldsEpisodes
      },
      required: {
        meta: requiredMeta,
        episodes: requiredEpisodes
      },
      uncleaned: {
        meta: uncleanedMeta,
        episodes: uncleanedEpisodes
      }
    }

    // if no options parameters given, use default
    if (typeof params === 'undefined') {
      options = DEFAULT
      return options
    }

    // merge empty options and given options
    Object.keys(options).forEach( key => {
      if (params[key] !== undefined) {
        Object.assign(options[key], params[key])
      }
    })

    // if 'default' given in parameters, merge default options with given custom options
    //  and dedupe
    if (options.fields.meta.indexOf('default') >= 0) {
      options.fields.meta = mergeDedupe([DEFAULT.fields.meta, params.fields.meta])
      options.fields.meta.splice(options.fields.meta.indexOf('default'), 1)
    }

    if (options.fields.episodes.indexOf('default') >= 0) {
      options.fields.episodes = mergeDedupe([DEFAULT.fields.episodes, params.fields.episodes])
      options.fields.episodes.splice(options.fields.episodes.indexOf('default'), 1)
    }

    return options

  } catch (err) {
    throw ERRORS.optionsError
  }
}

/*
=====================
=== GET FUNCTIONS ===
=====================
*/

const GET = exports.GET = {

  author: function (node) {
    if (node.author) {
      return node.author
    } else if (node[NS.itunesAuthor]) {
      return node[NS.itunesAuthor]
    }
  },

  blocked: function (node) {
    return node[NS.itunesBlock]
  },

  categories: function (node) {
    // returns categories as an array containing each category/sub-category
    // grouping in lists. If there is a sub-category, it is the second element
    // of an array.

    const categoriesArray = node["itunes:category"].map(item => {
      let category = ''
      category += item['$'].text // primary category
      if (item[NS.itunesCategory]) { // sub-category
        category += '>' + item[NS.itunesCategory][0]['$'].text
      }
      return category
    })

    return categoriesArray
  },

  chapters: function (node) {
    const items = getItemsWithAttrs(node[NS.podcastChapters])
    if (items && items[0]) {
      return {
        type: items[0].attrs.type,
        url: items[0].attrs.url
      }
    }
  },

  complete: function (node) {
    return node[NS.itunesComplete]
  },

  duration: function (node) {
    return node[NS.itunesDuraton]
  },

  editor: function (node) {
    return node.managingEditor
  },

  explicit: function (node) {
    return node[NS.itunesExplicit]
  },

  funding: function (node) {
    const items = getItemsWithAttrs(node[NS.podcastFunding])
    const finalItems = []

    for (const item of items) {
      finalItems.push({
        value: item.value,
        url: item.attrs.url
      })
    }

    return finalItems
  },

  guid: function (node) {
    if (node.guid) {
      if (typeof node.guid === 'string') {
        return node.guid
      } else if (Array.isArray(node.guid) && node.guid[0] && node.guid[0]._) {
        return node.guid[0]._
      }
    }
  },

  imageURL: function (node) {
    if (
      node.image &&
      node.image[0] &&
      node.image[0].url[0]
    ) {
      return node.image[0].url[0]
    }

    if (
      node["itunes:image"] &&
      node["itunes:image"][0] &&
      node["itunes:image"][0]['$'] &&
      node["itunes:image"][0]['$'].href
    ) {
      return node["itunes:image"][0]['$'].href
    }

    if (typeof node["itunes:image"] === 'string') {
      return node["itunes:image"]
    }

    return undefined
  },

  /*
    NOTE: This is part of the Podcast Index namespace spec.
    This is a Phase 2 namespace and has not been formalized at this time.
    https://github.com/Podcastindex-org/podcast-namespace/tree/7c9516937e74b8058d7d49e2b389c7c361cc6a48

    ---

    images: function (node) {
      const item = getItemsWithAttrs(node['podcast:images'])
      if (item[0]) {
        const srcset = item.attrs.srcset
        const srcSetArray = convertCommaDelimitedStringToArray(srcset)
        const parsedSrcSet = []
        for (let str of srcSetArray) {
          str = str.trim()
          const srcSetAttrs = str.split(' ')
          if (srcSetAttrs.length === 2) {
            parsedSrcSet.push({
              url: srcSetAttrs[0],
              width: srcSetAttrs[1]
            })
          }
        }

        return {
          srcset: parsedSrcSet
        }
      }
    },
  */

  keywords: function (node) {
    return node[NS.itunesKeywords]
  },

  /*
    NOTE: This is part of the Podcast Index namespace spec.
    This is a Phase 2 namespace and has not been formalized at this time.
    https://github.com/Podcastindex-org/podcast-namespace/tree/7c9516937e74b8058d7d49e2b389c7c361cc6a48

    ---

    location: function (node) {
      const item = getItemsWithAttrs(node['podcast:location'])
      if (item) {
        return {
          value: item.value,
          latlon: item.attrs.latlon,
          osmid: item.attrs.osmid
        }
      }
    },
  */

  locked: function (node) {
    const items = getItemsWithAttrs(node[NS.podcastLocked])
    if (items[0]) {
      return {
        value: items[0].value,
        owner: items[0].attrs.owner
      }
    }
  },

  order: function (node) {
    return node[NS.itunesOrder]
  },

  owner: function (node) {
    return node[NS.itunesOwner]
  },

  subtitle: function (node) {
    return node[NS.itunesSubtitle]
  },

  summary: function (node) {
    return node[NS.itunesSummary]
  },

  transcript: function (node) {
    const items = getItemsWithAttrs(node[NS.podcastTranscript])
    const finalItems = []
    
    if (Array.isArray(items)) {
      for (const item of items) {
        const { language, rel, type, url } = item.attrs
        finalItems.push({
          language,
          rel,
          type,
          url
        })
      }
    }

    return finalItems
  },

  type: function (node) {
    return node[NS.itunesType]
  },

  /*
    NOTE: This is part of the Podcast Index namespace spec.
    This is a Phase 2 namespace and has not been formalized at this time.
    https://github.com/Podcastindex-org/podcast-namespace/tree/7c9516937e74b8058d7d49e2b389c7c361cc6a48
    
    ---

    Retrieve only one value, and any number of nested recepients.
  */
  value: function (node) {
    const valueItems = getItemsWithAttrs(node[NS.podcastValue], [NS.podcastValueRecipient])
    const valueItem = Array.isArray(valueItems) && valueItems[0]
    let finalValue = null

    if (valueItem) {
      const { method, suggested, type } = valueItem.attrs
      finalValue = { method, suggested, type }

      const valueRecipientItems = valueItem.nestedTags && valueItem.nestedTags[NS.podcastValueRecipient]
      if (Array.isArray(valueRecipientItems)) {
        const finalRecipients = []
        for (const valueRecipientItem of valueRecipientItems) {
          const { address, name, split, type } = valueRecipientItem.attrs
          finalRecipients.push({ address, name, split, type })
        }
        finalValue.recipients = finalRecipients
      }
    }

    return finalValue
  }
}

const getDefault = exports.getDefault = function (node, field) {
  return (node[field]) ? node[field] : undefined
}

/*
=======================
=== CLEAN FUNCTIONS ===
=======================
*/

const CLEAN = exports.CLEAN = {
  author: function (obj) {
    return obj
  },

  blocked: function (string) {
    if (string.toLowerCase == 'yes') {
      return true
    } else {
      return false
    }
  },

  complete: function (string) {
    if (string[0].toLowerCase == 'yes') {
      return true
    } else {
      return false
    }
  },

  duration: function (string) {
    // gives duration in seconds
    let times = string[0].split(':'),
      sum = 0, mul = 1

    while (times.length > 0) {
      sum += mul * parseInt(times.pop())
      mul *= 60
    }

    return sum
  },

  enclosure: function (object) {
    return {
      length: object[0]["$"].length,
      type: object[0]["$"].type,
      url: object[0]["$"].url
    }
  },

  explicit: function (string) {
    if (['yes', 'explicit', 'true'].indexOf(string[0].toLowerCase()) >= 0) {
      return true
    } else if (['clean', 'no', 'false'].indexOf(string[0].toLowerCase()) >= 0) {
      return false
    } else {
      return undefined
    }
  },

  imageURL: function (string) {
    return string
  },

  owner: function (object) {
    let ownerObject = {}

    if (object[0].hasOwnProperty(NS.itunesName)) {
      ownerObject.name = object[0][NS.itunesName][0]
    }

    if (object[0].hasOwnProperty(NS.itunesEmail)) {
      ownerObject.email = object[0][NS.itunesEmail][0]
    }

    return ownerObject
  }
}

const cleanDefault = exports.cleanDefault = function (node) {
  // return first item of array
  if (node !== undefined && Array.isArray(node) && node[0]!== undefined) {
    return node[0]
  } else {
    return node
  }
}

/*
=================================
=== OBJECT CREATION FUNCTIONS ===
=================================
*/

const getInfo = exports.getInfo = function (node, field, uncleaned) {
  // gets relevant info from podcast feed using options:
  // @field - string - the desired field name, corresponding with GET and clean
  //     functions
  // @uncleaned - boolean - if field should not be cleaned before returning

  var info;

  // if field has a GET function, use that
  // if not, get default value
  info = (GET[field]) ? GET[field].call(this, node) : getDefault(node,field)

  // if field is not marked as uncleaned, clean it using CLEAN functions
  if (!uncleaned && info !== undefined) {
    info = (CLEAN[field]) ? CLEAN[field].call(this, info) : cleanDefault(info)
  } else {
  }

  return info
}

function createMetaObjectFromFeed (channel, options) {

  const meta = {}

  options.fields.meta.forEach( (field) => {
    const obj = {}
    var uncleaned = false

    if (options.uncleaned && options.uncleaned.meta) {
      var uncleaned = (options.uncleaned.meta.indexOf(field) >= 0)
    }

    obj[field] = getInfo(channel, field, uncleaned)

    Object.assign(meta, obj)
  })

  if (options.required && options.required.meta) {
    options.required.meta.forEach( (field) => {
      if (Object.keys(meta).indexOf(field) < 0) {
        throw ERRORS.requiredError
      }
    })
  }

  return meta
}

// function builds episode objects from parsed podcast feed
function createEpisodesObjectFromFeed (channel, options) {
  let episodes = []

  channel.item.forEach( (item) => {
    const episode = {}

    options.fields.episodes.forEach( (field) => {
      const obj = {}
      var uncleaned = false
      if (options.uncleaned && options.uncleaned.episodes) {
        var uncleaned = (options.uncleaned.episodes.indexOf(field) >= 0)
      }

      obj[field] = getInfo(item, field, uncleaned)

      Object.assign(episode, obj)
    })

    if (options.required && options.required.episodes) {
      options.required.episodes.forEach( (field) => {
        if (Object.keys(episode).indexOf(field) < 0) {
          throw ERRORS.requiredError
        }
      })
    }

    episodes.push(episode)
  })

  episodes.sort(
    function (a, b) {
      // sorts by order first, if defined, then sorts by date.
      // if multiple episodes were published at the same time,
      // they are then sorted by title
      if (a.order == b.order) {
        if (a.pubDate == b.pubDate) {
          return a.title > b.title ? -1 : 1
        }
        return b.pubDate > a.pubDate ? 1 : -1
      }

      if (a.order && !b.order) {
        return 1
      }

      if (b.order && !a.order) {
        return -1
      }

      return a.order > b.order ? -1 : 1
    }
  )

  return episodes
}

/*
======================
=== FEED FUNCTIONS ===
======================
*/

function promiseParseXMLFeed (feedText) {
  return new Promise((resolve, reject) => {
        parseString(feedText, (error, result) => {
            if (error) { reject(ERRORS.parsingError) }
            resolve(result)
        })
    })
}

function parseXMLFeed (feedText) {
    let feed = {}
    parseString(feedText, (error, result) => {
      if (error) {
        throw ERRORS.parsingError
      }
      Object.assign(feed, result)
      return result
    })
    return (feed)
}

async function fetchFeed (url) {
  try {
    const feedResponse = await fetch(url)
    const feedText = await feedResponse.text()
    const feedObject = await promiseParseXMLFeed(feedText)
    return feedObject
  } catch (err) {
    throw ERRORS.fetchingError
  }
}

/*
=======================
=== FINAL FUNCTIONS ===
=======================
*/

const getPodcastFromURL = exports.getPodcastFromURL = async function (url, params) {
  try {
    const options = buildOptions(params)

    const feedResponse = await fetchFeed(url)
    const channel = feedResponse.rss.channel[0]

    const meta = createMetaObjectFromFeed(channel, options)
    const episodes = createEpisodesObjectFromFeed(channel, options)

    return {meta, episodes}
  }
  catch (err) {
    throw err
  }
}

const getPodcastFromFeed = exports.getPodcastFromFeed = function (feed, params) {
  try {
    const options = buildOptions(params)

    const feedObject = parseXMLFeed(feed)
    const channel = feedObject.rss.channel[0]

    const meta = createMetaObjectFromFeed(channel, options)
    const episodes = createEpisodesObjectFromFeed(channel, options)

    return {meta, episodes}
  }
  catch (err) {
    throw err
  }
}

/*
=======================
=== HELPER FUNCTIONS ===
=======================
*/

const getItemsWithAttrs = (val, nestedTags = []) => {
  if (Array.isArray(val)) {
    const items = []

    for (const item of val) {
      if (typeof item === 'string') {
        items.push({
          value: item,
          attrs: {}
        })
      } else if (item) {
        const finalTags = {}
        if (nestedTags && nestedTags.length > 0) {
          for (const nestedTag of nestedTags) {
            const nestedItem = getItemsWithAttrs(item[nestedTag])
            finalTags[nestedTag] = nestedItem
          }
        }

        items.push({
          value: item._,
          attrs: item['$'] ? item['$'] : {},
          ...(Object.keys(finalTags).length > 0) ? { nestedTags: finalTags } : {}
        })
      }
    }

    return items
  }

  return []
}

const convertCommaDelimitedStringToArray = (str) => {
  str = str.replace(/(\r\n|\n|\r)/gm, '')
  str = str.split(',')
  return str
}
