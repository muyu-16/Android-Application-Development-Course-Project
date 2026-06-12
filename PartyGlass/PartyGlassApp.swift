import SwiftUI

@main
struct PartyGlassApp: App {
    @StateObject private var chipStore = ChipStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(chipStore)
                .preferredColorScheme(.dark)
        }
    }
}

struct ContentView: View {
    @State private var selectedTab: GameType = .rps
    @Namespace private var namespace

    var body: some View {
        ZStack(alignment: .bottom) {
            // Background
            Color.black
                .ignoresSafeArea()

            // Content
            TabView(selection: $selectedTab) {
                RPSScreen(namespace: namespace)
                    .tag(GameType.rps)
                TruthDareScreen(namespace: namespace)
                    .tag(GameType.truthDare)
                RouletteScreen(namespace: namespace)
                    .tag(GameType.roulette)
                DiceScreen(namespace: namespace)
                    .tag(GameType.dice)
                ChipScreen(namespace: namespace)
                    .tag(GameType.chips)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .ignoresSafeArea(edges: .bottom)

            // Glass Tab Bar
            GlassTabBar(selectedTab: $selectedTab, namespace: namespace)
                .padding(.horizontal, DesignToken.margin)
                .padding(.bottom, 8)
        }
    }
}

// MARK: - Glass Tab Bar
struct GlassTabBar: View {
    @Binding var selectedTab: GameType
    let namespace: Namespace.ID

    var body: some View {
        HStack(spacing: 0) {
            ForEach(GameType.allCases, id: \.self) { game in
                Button {
                    withAnimation(DesignToken.springBouncy) {
                        selectedTab = game
                    }
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: game.icon)
                            .font(.title3)
                            .fontWeight(selectedTab == game ? .semibold : .regular)
                        Text(game.rawName)
                            .font(.caption2)
                    }
                    .foregroundStyle(selectedTab == game
                        ? DesignToken.textPrimary
                        : DesignToken.textTertiary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                }
            }
        }
        .padding(.horizontal, 4)
        .background(
            RoundedRectangle(cornerRadius: DesignToken.cardCorner)
                .stroke(DesignToken.glassStroke, lineWidth: 0.5)
        )
        .glassEffectIfAvailable(.regular.tint(.blue.opacity(0.12)),
                                shape: RoundedRectangle(cornerRadius: DesignToken.cardCorner))
    }
}

extension GameType {
    var rawName: String {
        switch self {
        case .rps: return "Battle"
        case .truthDare: return "Truth"
        case .roulette: return "Spin"
        case .dice: return "Dice"
        case .chips: return "Chips"
        }
    }
}
