import SwiftUI
import ActivityKit

// MARK: - Design Tokens
enum DesignToken {
    // MARK: Layout
    static let margin: CGFloat = 20
    static let interCard: CGFloat = 16
    static let cardPadding: CGFloat = 20
    static let stackSpacing: CGFloat = 12
    static let contentGap: CGFloat = 8
    static let cardCorner: CGFloat = 20
    static let pillCorner: CGFloat = 999
    static let sheetCorner: CGFloat = 40

    // MARK: Colors
    static let accent = Color.blue // #0A84FF
    static let win = Color.green // #30D158
    static let lose = Color.red // #FF453A
    static let draw = Color.orange // #FF9F0A
    static let chipGold = Color.yellow // #FFD60A

    static let glassTint = Color.blue.opacity(0.15)
    static let glassHighlight = Color.white.opacity(0.3)
    static let glassStroke = Color.white.opacity(0.1)

    static let textPrimary = Color.white
    static let textSecondary = Color.white.opacity(0.65)
    static let textTertiary = Color.white.opacity(0.35)

    // MARK: Animation
    static let springBouncy = Animation.spring(response: 0.4, dampingFraction: 0.7)
    static let springSmooth = Animation.spring(response: 0.3, dampingFraction: 0.8)
    static let easeOut = Animation.easeOut(duration: 0.25)
}

// MARK: - Game Types
enum GameType: String, CaseIterable {
    case rps = "Rock Paper Scissors"
    case truthDare = "Truth or Dare"
    case roulette = "Roulette"
    case dice = "Dice Roll"
    case chips = "Chip Tracker"

    var icon: String {
        switch self {
        case .rps: return "hand.raised.fill"
        case .truthDare: return "questionmark.bubble.fill"
        case .roulette: return "target"
        case .dice: return "die.face.6.fill"
        case .chips: return "dollarsign.circle.fill"
        }
    }

    var color: Color {
        switch self {
        case .rps: return .blue
        case .truthDare: return .purple
        case .roulette: return .orange
        case .dice: return .pink
        case .chips: return .yellow
        }
    }
}

// MARK: - Dynamic Island Activity
struct PartyGlassAttributes: ActivityAttributes {
    public typealias ContentState = GameState

    public struct GameState: Codable, Hashable {
        var gameType: GameType
        var score: String
        var chipDelta: Int?
    }

    var appName: String = "PartyGlass"
}
