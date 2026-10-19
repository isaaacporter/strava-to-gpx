# Strava to GPX

A bookmark that downloads a Strava activity as a GPX file.

## Install

1. Open `bookmarklet.txt` and copy everything in it.
2. Create a new bookmark in your browser.
3. Paste the copied text as the bookmark's URL.

## Use

1. Log in to Strava and go to your desired activity
2. Click the bookmark.
3. Pick a detail level:
   - `min` - location and altitude
   - `default` - adds a time for each point
   - `full` - adds heart rate, cadence, power and temperature
4. Add the name of your GPX file.
5. The GPX file downloads.

## How it works

The data comes from this address:

```
https://www.strava.com/activities/<id>/streams?stream_types[]=latlng&stream_types[]=time&stream_types[]=altitude&stream_types[]=heartrate&stream_types[]=cadence&stream_types[]=watts&stream_types[]=temp
```
- `<id>` is the activity number from the page address.
- This is the same URl that Strava uses to display charts and graphs.
- You must be logged in to Strava to make this happen because this uses your own browser session to make the request.  

## Limits

- Start time is not real because that is not included in this data, but the time between points is all accurate.
- This is not in the official API, so this is undocumented and could be broken by Strava.

## Credits

Credit to [mapstogpx.com](https://mapstogpx.com/strava) for the idea.
This is a complete re-write that only runs in the browser and does not load any code from external sources.