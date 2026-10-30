import type { CommitteeKind } from "@/components/community-illustrations";

export interface CommitteeGuide {
  id: CommitteeKind;
  name: string;
  focus: string;
  description: string;
  sections: { title?: string; description?: string; examples: string[] }[];
}

// Descriptive content carried forward from Pawprints 2, not a live project roster.
export const committeeGuide: CommitteeGuide[] = [
  {
    id: "academics",
    name: "Academics and Co-ops",
    focus: "Classes, grading, and the co-op experience",
    description:
      "Discusses academic and co-op affairs and proposes ways to improve the learning experience at RIT.",
    sections: [
      {
        examples: [
          "Exploring grading scales that encourage students to challenge themselves through free electives.",
          "Making better use of student time during finals week.",
          "Advocating for timely grade feedback and an extended class drop period.",
        ],
      },
    ],
  },
  {
    id: "accessibility",
    name: "Accessibility",
    focus: "A more accessible and Deaf-friendly RIT/NTID",
    description:
      "Works to make the RIT/NTID experience more Deaf-friendly and to improve understanding and accessibility across campus.",
    sections: [
      {
        examples: [
          "Improving accessibility at Dining Services.",
          "Building understanding and relationships between the Monroe County Sheriff’s Office and Deaf students.",
          "Promoting ASL education across campus.",
        ],
      },
    ],
  },
  {
    id: "campus",
    name: "Facilities, Parking, Transportation and Sustainability",
    focus: "Campus spaces, getting around, and sustainable living",
    description:
      "Brings student needs into conversations about the spaces we use, how we travel, and the environmental impact of campus life.",
    sections: [
      {
        title: "Facilities",
        description:
          "Works with Facilities Management Services on maintenance and cleanliness.",
        examples: [
          "Improving residence-hall restroom cleaning and access to trash cans.",
          "Addressing pests, including mice and cockroaches.",
          "Improving lighting around campus.",
        ],
      },
      {
        title: "Parking and transportation",
        description:
          "Works with Parking and Transportation Services on parking access and shuttle services.",
        examples: [
          "Advocating for more reliable buses.",
          "Evaluating campus parking needs.",
        ],
      },
      {
        title: "Sustainability",
        description:
          "Explores ways to make sustainable choices more accessible at RIT.",
        examples: [
          "Exploring special interest housing focused on environmental sustainability.",
          "Creating multipurpose sustainable art installations.",
          "Mapping and expanding recycling, bottle returns, trash cans, bike racks, bottle-filling stations, the community garden, plant-based dining, and donation bins.",
        ],
      },
    ],
  },
  {
    id: "housing",
    name: "Housing and Dining",
    focus: "Where students live, eat, and feel at home",
    description:
      "Brings together perspectives from Housing, Residence Life, Dining, Auxiliary Services, Sustainability, and Facilities Management Services.",
    sections: [
      {
        examples: [
          "Addressing inflation and rising food costs.",
          "Overseeing residence-hall renovations.",
          "Promoting dining initiatives and cultural food events.",
          "Expanding access to Halal, Kosher, and other dietary options.",
        ],
      },
    ],
  },
  {
    id: "student",
    name: "Student Affairs",
    focus: "The opportunities and everyday realities of student life",
    description:
      "Takes on issues that improve student life and access to opportunities at RIT.",
    sections: [
      {
        examples: [
          "Improving Counseling and Psychological Services.",
          "Developing a Study Abroad Endowment Scholarship.",
          "Advocating for higher student wages.",
          "Promoting financial literacy.",
        ],
      },
    ],
  },
  {
    id: "wellbeing",
    name: "Well-Being",
    focus: "Physical, mental, and emotional well-being",
    description:
      "Works with campus partners such as Integrated Health Services and RIT FoodShare to support a thriving, inclusive campus community.",
    sections: [
      {
        examples: [
          "Using visual markers to help students identify faculty, staff, and peers equipped to connect them with health resources.",
          "Providing resources, events, and support for physical, mental, and emotional well-being.",
        ],
      },
    ],
  },
];
