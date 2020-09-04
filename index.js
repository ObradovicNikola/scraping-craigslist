// const request = require("request-promise");
const request = require("requestretry").defaults({ fullResponse: false });
const cheerio = require("cheerio");
const ObjectsToCsv = require("objects-to-csv");

const url = "https://vienna.craigslist.org/search/jjj?lang=en&cc=us";

const scrapeSample = {
  title: "Technical Autonomous Vehicle Trainer",
  description: "We're the driverless car company...",
  datePosted: new Date("2018-07-13"),
  url:
    "https://vienna.craigslist.org/edu/d/online-120-hour-tefl-diploma-with/7188015198.html?lang=en&cc=us",
  hood: "Vienna",
  address: "my street",
  compensation: "23/hr",
};

const scrapeResults = [];

async function scrapeJobHeader() {
  try {
    const htmlResult = await request.get(url);
    const $ = await cheerio.load(htmlResult);

    $(".result-info").each((index, element) => {
      const resultTitle = $(element).children(".result-title");
      const title = resultTitle.text();
      const url = resultTitle.attr("href");
      const datePosted = new Date($(element).children("time").attr("datetime"));
      const neighbourhood = $(element).find(".result-hood").text().trim();

      const scrapeResult = { title, url, datePosted, neighbourhood };
      scrapeResults.push(scrapeResult);
    });

    return scrapeResults;
  } catch (err) {
    console.log(err);
  }
}

async function scrapeDescription(jobsWithHeaders) {
  return await Promise.all(
    jobsWithHeaders.map(async (job) => {
      const htmlResult = await request.get(job.url);
      const $ = await cheerio.load(htmlResult);
      $(".print-qrcode-container").remove();
      job.description = $("#postingbody").text();
      job.address = $("div.mapaddress").text();
      job.compensation = $(".attrgroup")
        .children()
        .first()
        .text()
        .replace("compensation: ", "");
      return job;
    })
  );
}

async function createCsvFile(data) {
  let csv = new ObjectsToCsv(data);
  await csv.toDisk("./test.csv");
}

async function scrapeCraigslist() {
  const jobsWithHeaders = await scrapeJobHeader();
  const jobsFullData = await scrapeDescription(jobsWithHeaders);

  await createCsvFile(jobsFullData);
}

scrapeCraigslist();
