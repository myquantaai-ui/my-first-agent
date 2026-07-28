function log(msg) {
  const logDiv = document.getElementById("log");
  logDiv.textContent += `\n${msg}`;
  console.log(msg);
}

function setStatus(msg) {
  document.getElementById("log").textContent = msg;
  console.log(msg);
}

async function startAgent() {
  const openaiKey = document.getElementById("openaiKey").value.trim();
  const falKey = document.getElementById("falKey").value.trim();
  const userPrompt = document.getElementById("userPrompt").value.trim();
  const btn = document.getElementById("generateBtn");

  if (!openaiKey || !falKey || !userPrompt) {
    alert("Please provide both API keys and a prompt idea.");
    return;
  }

  btn.disabled = true;
  document.getElementById("imageOutput").innerHTML = "";
  document.getElementById("videoOutput").innerHTML = "";

  try {
    // STEP 1: Enhance Prompt using NVIDIA NIM API
const nvidiaKey = document.getElementById("nvidiaKey").value.trim();

setStatus("🤖 Agent is refining prompt using NVIDIA Nemotron...");

const gptResponse = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${nvidiaKey}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "meta/llama-3.1-40b-instruct", // Or "nvidia/nemotron-4-340b-instruct"
    messages: [
      { 
        role: "system", 
        content: "You are an expert AI prompt engineer. Turn simple ideas into highly detailed, cinematic, high-quality image prompts. Return ONLY the enhanced prompt string." 
      },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 300
  })
});

if (!gptResponse.ok) throw new Error(`NVIDIA API Error: ${gptResponse.statusText}`);

const gptData = await gptResponse.json();
const enhancedPrompt = gptData.choices[0].message.content.trim();

log(`✨ Enhanced Prompt:\n"${enhancedPrompt}"`);
    // ----------------------------------------------------
// STEP 2: Generate Image using NVIDIA NIM API (FLUX.1-schnell)
// ----------------------------------------------------
log("\n🎨 Generating Image via NVIDIA FLUX.1...");

const imageResponse = await fetch("https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux1-schnell", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${nvidiaKey}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: enhancedPrompt,
    mode: "base"
  })
});

if (!imageResponse.ok) throw new Error(`NVIDIA Image Error: ${imageResponse.statusText}`);

const imageData = await imageResponse.json();
// NVIDIA returns base64 image data in imageData.b64_json or image URL
const imageSrc = imageData.b64_json 
  ? `data:image/jpeg;base64,${imageData.b64_json}` 
  : imageData.artifacts[0].base64;

log(`🖼️ Image Generated via NVIDIA!`);
document.getElementById("imageOutput").innerHTML = `
  <h3>Generated Base Image (NVIDIA FLUX)</h3>
  <img src="${imageSrc}" alt="Generated AI Image" />
`;
    // ----------------------------------------------------
    // STEP 3: Animate Image to Video (Luma Dream Machine)
    // ----------------------------------------------------
    log("\n🎬 Submitting Image to Video Generator (Luma)...");

    const videoResponse = await fetch("https://fal.run/fal-ai/luma-dream-machine/image-to-video", {
      method: "POST",
      headers: {
        "Authorization": `Key ${falKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: "Cinematic camera movement, high quality",
        image_url: imageUrl
      })
    });

    if (!videoResponse.ok) throw new Error(`Fal Video Error: ${videoResponse.statusText}`);
    const videoData = await videoResponse.json();
    const videoUrl = videoData.video ? videoData.video.url : videoData.url;

    log(`🚀 Video Ready!`);
    document.getElementById("videoOutput").innerHTML = `
      <h3>Generated Video Animation</h3>
      <video src="${videoUrl}" controls autoplay loop></video>
    `;

  } catch (err) {
    log(`\n❌ Error: ${err.message}`);
  } finally {
    btn.disabled = false;
  }
}
