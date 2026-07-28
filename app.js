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
    // ----------------------------------------------------
    // STEP 1: Enhance Prompt with OpenAI
    // ----------------------------------------------------
    setStatus("🤖 Agent is refining prompt using GPT-4o-mini...");

    const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert AI prompt engineer. Turn simple ideas into highly detailed, cinematic, high-quality image prompts. Return ONLY the enhanced prompt string." },
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!gptResponse.ok) throw new Error(`OpenAI Error: ${gptResponse.statusText}`);
    const gptData = await gptResponse.json();
    const enhancedPrompt = gptData.choices[0].message.content.trim();

    log(`✨ Enhanced Prompt:\n"${enhancedPrompt}"`);

    // ----------------------------------------------------
    // STEP 2: Generate Image with Fal.ai (Flux Schnell)
    // ----------------------------------------------------
    log("\n🎨 Generating Image via Fal.ai (Flux)...");

    const imageResponse = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        "Authorization": `Key ${falKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        image_size: "landscape_16_9"
      })
    });

    if (!imageResponse.ok) throw new Error(`Fal Image Error: ${imageResponse.statusText}`);
    const imageData = await imageResponse.json();
    const imageUrl = imageData.images[0].url;

    log(`🖼️ Image Generated!`);
    document.getElementById("imageOutput").innerHTML = `
      <h3>Generated Base Image</h3>
      <img src="${imageUrl}" alt="Generated AI Image" />
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
