'use client'

export function Hero() {
  return (
    <div className="relative bg-[#010005] overflow-hidden">
      {/* Aurora Layer */}
      <div className="absolute inset-0 pointer-events-none">
        {/* LEFT GLOW */}
        <div
          className="absolute w-[919px] h-[898px] left-[-557px] top-[607px]
            blur-[74px] opacity-60"
          style={{
            background: 'linear-gradient(136deg, #0F03FF 18%, #FFFFFF 62%)',
          }}
        />

        <div
          className="absolute w-[919px] h-[898px] left-[-557px] top-[607px]
            blur-[25px] opacity-40"
          style={{
            background: 'linear-gradient(136deg, #0F03FF 18%, #FFFFFF 62%)',
          }}
        />

        {/* SMALL GREEN DOT */}
        <div
          className="absolute w-[190px] h-[207px] left-[-172px] top-[939px]
            bg-[#B4FF64] blur-[35px] opacity-60"
        />

        {/* MAIN RIGHT AURORA */}
        <div
          className="absolute w-[839px] h-[583px] left-[766px] top-[37px]
            blur-[43px] rounded-[200px] opacity-70"
          style={{
            background: 'linear-gradient(111deg, #0F03FF, #0F03FF, #FFFFFF)',
          }}
        />

        <div
          className="absolute w-[833px] h-[520px] left-[772px] top-[52px]
            blur-[15px] rounded-[200px] opacity-80"
          style={{
            background: 'linear-gradient(98deg, #0F03FF, #0F03FF, #FFFFFF)',
          }}
        />

        {/* PINK STREAK */}
        <div
          className="absolute w-[454px] h-[208px] left-[1037px] top-[123px]
            blur-[30px] rounded-[200px] opacity-80"
          style={{
            background: 'linear-gradient(85deg, #FB9AD6, #FF1EA9, #0F03FF)',
          }}
        />

        {/* GREEN LOWER RIGHT */}
        <div
          className="absolute w-[310px] h-[238px] left-[1098px] top-[336px]
            bg-[#B4FF64] blur-[38px] opacity-70"
        />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 md:px-[100px] pt-[120px] md:pt-[190px] pb-[80px] md:pb-[120px]">
        <h1 className="text-[40px] md:text-[66px] leading-[1.2] md:leading-[98px] text-[#F7F8FC] font-serif max-w-[640px]">
          Decentralized AI inference.
        </h1>

        <p className="mt-[20px] text-[16px] md:text-[18px] leading-[26px] md:leading-[28px] text-[#9FA4B2] max-w-[871px]">
          Community-owned compute. GPU contributors earn USDC. Developers get OpenAI-compatible API access. No logs, ever. Censorship resistant.
        </p>

        {/* Buttons */}
        <div className="mt-[36px] flex flex-col sm:flex-row gap-4 sm:gap-[30px]">
          <button className="h-[52px] px-[24px] bg-[#F7F8FC] text-[#07090E] rounded-full text-[16px] font-medium hover:bg-white transition-colors">
            Get an API key
          </button>

          <button className="h-[52px] px-[24px] bg-white/5 border border-white/10 backdrop-blur-sm text-white rounded-full text-[16px] hover:bg-white/10 transition-colors">
            Read the quickstart
          </button>
        </div>

        {/* Subtext */}
        <p className="mt-[16px] text-sm text-[#9FA4B2]">
          OpenAI-compatible and MCP. Works with Claude Code, Cursor, LangChain, and any agent framework.
        </p>
      </div>
    </div>
  )
}
