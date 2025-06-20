import { TpaServer, TpaSession } from "@augmentos/sdk";
import { EventSource } from "eventsource";

const PACKAGE_NAME = "com.augmentos.assist"; // CHANGE THIS!
const PORT = 8080;  // Choose a port for your app's server.
const API_KEY = 'a820845098ff430331b7f1a27e46675aed69863b0f485af62d046490a0223b95'; // Replace with your API key.

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function function_desc(name) {

    const funcs = {
        "manage_google_data": "jarvis interacted with google",
        "set_device_attribute": "jarvis manipulated a device",
        "query_agent": "jarvis ran a query",
        "get_traffic_incidents": "jarvis grouped traffic incidents",
        "get_emails": "jarvis scanned emails",
        "getCameraSnapshot": "jarvis veiwed a camera",
        "add_to_knoledge_bank": "jarvis added to knoledge bank",
        "remove_from_knoledge_bank": "jarvis removed a knolege bank item",
        "send_notification": "jarvis send a notification",
        "show_image": "jarvis displayed an image",
        "generate_image": "jarvis generated an image",
        "weather": "jarvis accumulated weather patterns",
        "fetch": "jarvis performed a fetch request",
        "open": "jarvis launched a webpage",
        "place_call": "jarvis initiated a phone call",
        "sms": "jarvis initiated a message stream prompt",
        "translate": "jarvis translated text",
        "set_device_state": "jarvis manipulated device state",
        "turn_off_device": "jarvis switched off a device",
        "turn_on_device": "jarvis switched on a device",
        "check_device_status": "jarvis retreived device information",
        "list_devices": "jarvis accumulated devices",
        "change_device_color": "jarvis manipulated device color",
        "set_brightness": "jarvis manipulated device brightness",
        "launch_service": "jarvis launched service on device",
        "set_volume": "jarvis manipulated device volume",
        "get_calendar_events": "jarvis accumulated events",
        "check_event_on_calendar": "jarvis scanned calendar",
        "create_calendar_event": "jarvis created event",
        "delete_event": "jarvis removed event",
        "police_reports": "jarvis scanned police records",
        "dvla_search": "jarvis scanned DVLA database",
        "general_query": "jarvis queried wolfram alpha",
        "deep_query": "jarvis compiled query data",
        "get_contact_info": "jarvis scanned contacts",
        "traffic_results": "jarvis searched traffic",
        "travel_info": "jarvis planned route",
        "search_web": "jarvis crawled web results",
        "activate_protocol": "jarvis activated protocol",
        "deactivate_protocol": "jarvis deactivated protocol",
        "list_protocols": "jarvis indexed protocols"
    }
    return (funcs[name] || `jarvis ran ${name}`)

}


import puppeteer from 'puppeteer';
import sharp from 'sharp';

export async function captureDivAsBase64PNG(url: string, divSelector: string): Promise<string> {
  console.warn(url, "<- URL");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle2' });

  // Ensure the element exists
  const element = await page.$(divSelector);
  if (!element) {
    await browser.close();
    throw new Error(`Element not found: ${divSelector}`);
  }

  const screenshotBuffer = await element.screenshot({ type: 'png' }) as Buffer;

  // Process the image:
  // 1. Remove black background (threshold to remove dark pixels).
  // 2. Invert the image, swapping white and black.
  const processedImage = await sharp(screenshotBuffer)
    .threshold(150) // Remove dark pixels, threshold value can be adjusted
    .negate() // Invert the image (white becomes black, black becomes white)
    .toBuffer();

  await browser.close();
  return processedImage.toString('base64');
}

class ExampleAugmentOSApp extends TpaServer {
  protected async onSession(session: TpaSession, sessionId: string, userId: string): Promise<void> {

    let skipCheck = false

    sleep(2000).then(() => {
      session.layouts.showTextWall("\n⬤ JARVIS - connected", { durationMs: 3000 })
    })

    let latestTranscript = "";

    type Transcript = {
      content: string
      timestamp: Date
    }


    let latestResponse = { content: "", timestamp: new Date()}
    let transcripts: Transcript[] = [];

    let waiting = false

    const cleanup = [
      session.events.onTranscription((data) => {

        // const b64Test = "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"
        // session.layouts.showBitmapView(b64Test, {
        //   durationMs: 10000
        // })


        if (!data.text) return;

        latestTranscript = data.text;

        const isFocused = latestTranscript.toLowerCase()
          .replace(/[^\w\s]|_/g, "")
          .replace(/\s+/g, " ")
          .includes("jarvis");

        if ((isFocused||skipCheck) && !waiting) {
          session.layouts.showDoubleTextWall("Transcribing...", latestTranscript, {
            durationMs: 3000
          });
        }

        function checkActions() {
          console.warn("checking actions")
          const actions = {
            "test transcription": () => {session.layouts.showTextWall("Transcription working", { durationMs: 3000 })}
          }

          Object.keys(actions).map(trigger => {
            if (latestTranscript.toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ") === trigger) { 
              actions[trigger]()
            }
          })

          return Object.keys(actions).some(trigger => latestTranscript.toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ") === trigger)
        }

        if (data.isFinal && checkActions() && !waiting) {

        }
        else if (data.isFinal) {

          transcripts.push({ content: latestTranscript, timestamp: new Date() })

          if (!waiting) {
              
            if (["hey jarvis", "jarvis"].includes(latestTranscript.toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " "))) {
              sleep(1300).then(() => {

                  latestResponse = {content: "listening...", timestamp: new Date()}
                  session.layouts.showTextWall("Listening...", {durationMs: 10000})
                  skipCheck = true
                  waiting = false

              });

            } else {
              if (!waiting) {
                let ogSkip = skipCheck
                skipCheck = false;
                waiting = true;
                handleFinalTranscript(latestTranscript, ogSkip).then(() => { waiting = false; })
              }
            }

          }
        }

      }),

      session.events.onError((error) => {
        console.error("Error:", error);
      })
    ];


    async function runNLU(transcript: string, transcripts: any, latest: string, url: string) {
    //   const nluEndpoint = "https://jarvis-online.vercel.app/api/nlu";
      const nluEndpoint = url

      const payload = {
        transcription: transcript,
        recentJarvisResponse: latest,
        previousTranscriptions: transcripts || [],
        location: "unknown", // From our context
        currentTime: new Date().toISOString(), // Get current time
      };


      try {
        const response = await fetch(nluEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          console.error(`NLU API error: ${response.status} - ${response.statusText}`);
          return { isTargeted: false, error: `NLU API error: ${response.status}` };
        }

        const data = await response.json();
        return data; // Expected format: { isTargeted: true/false }

      } catch (error) {
        console.error("Error calling NLU API:", error);
        return { isTargeted: false, error: "Error calling NLU API" };
      }
    }

    const handleFinalTranscript = async (transcript: string, skipCheck: boolean) => {
      try {
        const modelToUse = session.settings.get("model")
        const api_key = session.settings.get("api_key");

        const urls = {
          jarvis: {
            local: `http://localhost:3000/api/jarvis-stream?key=${api_key}&text=${transcript}&conversation=false&model=${modelToUse}&recentTranscripts=${transcripts.filter(t => (Number(new Date() )- Number(t.timestamp)) < 30000).map(t => t.content)}`,
            live: `https://jarvis-online.vercel.app/api/jarvis-stream?key=${api_key}&text=${transcript}&conversation=false&model=${modelToUse}&recentTranscripts=${transcripts.filter(t => (Number(new Date() )- Number(t.timestamp)) < 30000).map(t => t.content)}`
          },
          nlu: {
            local: `http://localhost:3000/api/nlu`,
            live: `https://jarvis-online.vercel.app/api/nlu`
          }
        }

        const nluResult = await (async () => { if (skipCheck) {return skipCheck} else { const result = await runNLU( transcript, transcripts.filter(t => (Number(new Date() )- Number(t.timestamp)) < 30000).map(t => t.content), (Number(new Date()) - Number(latestResponse.timestamp)) < 60000 ? latestResponse.content : "null", urls?.nlu?.local ); return result?.isTargeted } })()

        if (nluResult) {


        if (!api_key) {
          session.layouts.showTextWall("Error, No API Key. Specify in settings!");
          return;
        }

          sleep(1300).then(() => {
            session.layouts.showTextWall("Processing...", {durationMs: 10000});
          })

          const splitContent = (input:string) => {
              const parts: Object[] = []
              let lastIndex = 0;
            
              const regex = /<codebox\s+lang=["'](\w+)["']>([\s\S]*?)<\/codebox>|<think>([\s\S]*?)<\/think>/gi;
              let match;
            
              while ((match = regex.exec(input)) !== null) {
                if (match.index > lastIndex) {
                  parts.push(input.slice(lastIndex, match.index));
                }
            
                if (match[1]) {
                  // codebox match
                  const lang = match[1];
                  const code = match[2];
                  parts.push(` ${lang.split("").map((l, i) => i==0 ? l.toUpperCase() : l).join("")} Code\n- 𝗦𝗧𝗔𝗥𝗧 -\n\n${code}\n\n- 𝗘𝗡𝗗 -`);
                } else if (match[3]) {
                  // think match
                  const thinkContent = match[3];
                  parts.push("- jarvis reasoned -");
                }
            
                lastIndex = regex.lastIndex;
              }
            
              if (lastIndex < input.length) {
                parts.push(input.slice(lastIndex));
              }
            
              return parts;
            };

          const stream = new EventSource(session.settings.get("server")==="dev" ? urls.jarvis.local : urls.jarvis.live);
          const frames: any[] = [];
          let finalMessage = ""

          stream.onmessage = (event) => {
            if (event.data === "[DONE]") {
              latestResponse = {content: finalMessage, timestamp: new Date()}
              waiting = false;
            } else {
              const data = JSON.parse(event.data);
              const response = data?.response;
              const Newframes = data?.frames
              const finalResponse = data?.finished_output
              if (Array.isArray(Newframes)) frames.push(...Newframes)

              if (data?.tool_call) {
                session.layouts.showDoubleTextWall("Tool Call", function_desc(data?.tool_call?.name), {durationMs: 3000})
              }
              if (response && !finalResponse) {
                session.layouts.showTextWall(response, { durationMs: response.length <= 100 ? 5000 : response.length <= 200 ? 8000 : response.length <= 300 ? 15000 : response.length <= 400 ? 20000 : 30000 });
              }
              else if (finalResponse) {

                async function displayTextInChunks(text: string): Promise<void> {
                  // Retrieve WPM from session settings, default to 110 if not found.
                  const wpm = session.settings.get("wpm") || 110;
                  console.warn(`Words Per Minute (WPM): ${wpm}`); // Log WPM for debugging

                  // Helper function to calculate reading time in milliseconds.
                  function readingTimeMs(text: string, wpm: number): number {
                    const words = text.trim().split(/\s+/).length;
                    // Ensure WPM is not zero to prevent division by zero errors.
                    const minutes = words / (wpm > 0 ? wpm : 1);
                    return Math.round(minutes * 60000); // Convert minutes to milliseconds
                  }

                  // Split the text into sentences. Handles various sentence endings.
                  // Uses a more robust regex for sentence splitting.
                  const sentences: string[] = text.match(/[^.!?]+(?:[.!?]|$)/g) || [text];
                  const chunks: string[] = [];
                  let currentChunk = '';
                  const maxChunkLength = 291; // Define max chunk length as a constant for clarity

                  for (const sentence of sentences) {
                    // Check if adding the next sentence exceeds the max chunk length.
                    if ((currentChunk + sentence).length <= maxChunkLength) {
                      currentChunk += sentence;
                    } else {
                      // If currentChunk is not empty, push it before starting a new one.
                      if (currentChunk) {
                        chunks.push(currentChunk.trim());
                      }
                      currentChunk = sentence; // Start a new chunk with the current sentence.
                    }
                  }
                  // Push any remaining content in currentChunk after the loop.
                  if (currentChunk) {
                    chunks.push(currentChunk.trim());
                  }

                  // Iterate through each chunk and display it.
                  for (const chunk of chunks) {
                    const duration = readingTimeMs(chunk, wpm);
                    console.warn(`Chunk: "${chunk}" | Reading Time (ms): ${duration}`); // Log chunk and its duration

                    // Display the text wall for the calculated duration.
                    session.layouts.showTextWall(chunk, { durationMs: duration });

                    // Wait for the duration of the text display before proceeding to the next chunk.
                    // This is the crucial fix: you only need to await this duration once.
                    await sleep(duration);
                  }
                }
                  displayTextInChunks(splitContent(finalResponse).filter(c => typeof c === "string").join("\n")).then(() => {
                    if (frames.length > 0) {
                      console.warn(frames)
                      for (const url in frames) {
                          captureDivAsBase64PNG(`https://jarvis-online.netlify.app${frames[url]}`, "#card").then(b64 => {
                            console.warn("\n\n", `data:image/png;base64,${b64}`)
                            session.layouts.showBitmapView(String(`${b64}`), { durationMs: 6000 })
                          }).then(() => sleep(6000))
                      }
                    }
                  })
              }
              if (response) {
                finalMessage = response
              }
            }
          };

          stream.onerror = (err) => {
            latestResponse = {content: finalMessage, timestamp: new Date()}
            console.error("Stream error:", err);
              waiting = false;
            stream.close();
          };


        }

      } catch (error) {
              waiting = false;
        console.error("Processing failure:", error);
        session.layouts.showTextWall("An error occurred.");
      } finally {
        waiting = false;
        latestTranscript = "";
      }
    };

    cleanup.forEach(handler => this.addCleanupHandler(handler));
  }
}

// Create and start the app server
const server = new ExampleAugmentOSApp({
    packageName: PACKAGE_NAME,
    apiKey: API_KEY,
    port: PORT,
    publicDir: "public/",
});

server.start().catch(err => {
    console.error("Failed to start server:", err);
});