import re

with open("frontend/src/pages/PremiosWebPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
"""                                            <div>
                                                <p className="font-bold text-gray-900">{reward.title}</p>
                                                <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{reward.tag}</span>
                                            </div>
                                </td>""",
"""                                            <div>
                                                <p className="font-bold text-gray-900">{reward.title}</p>
                                                <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{reward.tag}</span>
                                            </div>
                                        </div>
                                </td>"""
)

with open("frontend/src/pages/PremiosWebPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)
